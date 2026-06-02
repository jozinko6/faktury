import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

const vatRates = {
  "SK-23": 23,
  "SK-19": 19,
  "SK-5": 5,
  "SK-0": 0,
  "SK-RC": 0
} as const;

type VatRateCode = keyof typeof vatRates;

export type CreateDraftInvoiceItemInput = {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceNet: number;
  discountPercent?: number;
  vatRateCode: VatRateCode;
  vatTreatmentCode: string;
};

export type CreateDraftInvoiceInput = {
  id?: string;
  auditEventId?: string;
  organizationId: string;
  customerId: string;
  issueDate: string;
  deliveryDate: string;
  dueDate: string;
  paymentMethod?: string;
  vatMode: string;
  items: CreateDraftInvoiceItemInput[];
  createdAt?: Date;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateLine(item: CreateDraftInvoiceItemInput) {
  if (item.quantity <= 0) {
    throw new Error("Invoice item quantity must be greater than zero.");
  }

  if (!item.description.trim()) {
    throw new Error("Invoice item description is required.");
  }

  const discountPercent = item.discountPercent ?? 0;
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invoice item discount must be between 0 and 100.");
  }

  const netBeforeDiscount = item.quantity * item.unitPriceNet;
  const lineNet = roundMoney(netBeforeDiscount * (1 - discountPercent / 100));
  const lineVat = roundMoney(lineNet * (vatRates[item.vatRateCode] / 100));

  return {
    discountPercent,
    lineNet,
    lineVat,
    lineGross: roundMoney(lineNet + lineVat)
  };
}

export async function createDraftInvoice(
  input: CreateDraftInvoiceInput,
  client: PrismaClient = defaultPrisma
) {
  if (input.items.length === 0) {
    throw new Error("Draft invoice must contain at least one item.");
  }

  const now = input.createdAt ?? new Date();
  const invoiceId = input.id ?? randomUUID();
  const auditEventId = input.auditEventId ?? randomUUID();
  const calculatedItems = input.items.map((item) => ({
    ...item,
    id: item.id ?? randomUUID(),
    ...calculateLine(item)
  }));
  const netTotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineNet, 0));
  const vatTotal = roundMoney(calculatedItems.reduce((sum, item) => sum + item.lineVat, 0));
  const grossTotal = roundMoney(netTotal + vatTotal);

  return client.$transaction(async (transaction) => {
    const partner = await transaction.businessPartner.findFirst({
      where: {
        id: input.customerId,
        organizationId: input.organizationId
      },
      select: {
        id: true
      }
    });

    if (!partner) {
      throw new Error("Customer does not belong to the selected organization.");
    }

    const invoice = await transaction.invoice.create({
      data: {
        id: invoiceId,
        organizationId: input.organizationId,
        customerId: input.customerId,
        type: "invoice",
        status: "draft",
        number: null,
        variableSymbol: null,
        currency: "EUR",
        issueDate: new Date(input.issueDate),
        deliveryDate: new Date(input.deliveryDate),
        dueDate: new Date(input.dueDate),
        paymentMethod: input.paymentMethod ?? "bank_transfer",
        vatMode: input.vatMode,
        netTotal,
        vatTotal,
        grossTotal,
        allocatedPaymentsTotal: 0,
        creditNotesTotal: 0,
        remainingBalance: grossTotal,
        issueSnapshotJson: null,
        createdAt: now,
        updatedAt: now,
        items: {
          create: calculatedItems.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceNet: item.unitPriceNet,
            discountPercent: item.discountPercent,
            vatRateCode: item.vatRateCode,
            vatTreatmentCode: item.vatTreatmentCode,
            lineNet: item.lineNet,
            lineVat: item.lineVat,
            lineGross: item.lineGross
          }))
        }
      },
      include: {
        items: true
      }
    });

    await transaction.auditEvent.create({
      data: {
        id: auditEventId,
        organizationId: input.organizationId,
        entityType: "invoice",
        entityId: invoice.id,
        action: "invoice_draft_created",
        actorId: null,
        occurredAt: now,
        oldValueJson: null,
        newValueJson: JSON.stringify({
          status: invoice.status,
          number: invoice.number,
          grossTotal
        }),
        reason: "Draft invoice created",
        previousHash: null,
        currentHash: null
      }
    });

    return invoice;
  });
}
