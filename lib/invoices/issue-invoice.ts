import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export type IssueInvoiceInput = {
  invoiceId: string;
  organizationId: string;
  auditEventId?: string;
  issuedAt?: Date;
};

function formatInvoiceNumber(pattern: string, issuedAt: Date, sequence: number, padding: number) {
  const year = issuedAt.getUTCFullYear().toString();
  const paddedSequence = sequence.toString().padStart(padding, "0");

  return pattern.replace("{YYYY}", year).replace("{NNNN}", paddedSequence);
}

function variableSymbolFromNumber(number: string) {
  return number.replace(/\D/g, "").slice(-20);
}

export async function issueInvoice(input: IssueInvoiceInput, client: PrismaClient = defaultPrisma) {
  const issuedAt = input.issuedAt ?? new Date();
  const auditEventId = input.auditEventId ?? randomUUID();

  return client.$transaction(async (transaction) => {
    const invoice = await transaction.invoice.findFirst({
      where: {
        id: input.invoiceId,
        organizationId: input.organizationId
      },
      include: {
        items: true,
        customer: true,
        organization: true
      }
    });

    if (!invoice) {
      throw new Error("Invoice was not found for the selected organization.");
    }

    if (invoice.status !== "draft" && invoice.status !== "ready") {
      throw new Error(`Only draft or ready invoices can be issued. Current status: ${invoice.status}.`);
    }

    if (invoice.number !== null) {
      throw new Error("Invoice already has an assigned number.");
    }

    const series = await transaction.numberSeries.findFirst({
      where: {
        organizationId: input.organizationId,
        documentType: "invoice",
        assignOn: "issue",
        isActive: true
      },
      orderBy: {
        validFrom: "desc"
      }
    });

    if (!series) {
      throw new Error("Active invoice number series was not found.");
    }

    const sequence = series.nextNumber;
    const number = formatInvoiceNumber(series.pattern, issuedAt, sequence, series.padding);
    const variableSymbol = variableSymbolFromNumber(number);
    const issueSnapshot = {
      number,
      variableSymbol,
      capturedAt: issuedAt.toISOString(),
      supplierSnapshot: {
        legalName: invoice.organization.legalName,
        ico: invoice.organization.ico,
        dic: invoice.organization.dic,
        icDph: invoice.organization.icDph,
        country: invoice.organization.country
      },
      customerSnapshot: {
        legalName: invoice.customer.legalName,
        displayName: invoice.customer.displayName,
        country: invoice.customer.country
      },
      itemsSnapshot: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity.toString(),
        unit: item.unit,
        unitPriceNet: item.unitPriceNet.toString(),
        vatRateCode: item.vatRateCode,
        vatTreatmentCode: item.vatTreatmentCode,
        lineNet: item.lineNet.toString(),
        lineVat: item.lineVat.toString(),
        lineGross: item.lineGross.toString()
      })),
      totalsSnapshot: {
        netTotal: invoice.netTotal.toString(),
        vatTotal: invoice.vatTotal.toString(),
        grossTotal: invoice.grossTotal.toString(),
        remainingBalance: invoice.remainingBalance.toString()
      }
    };

    await transaction.numberSeries.update({
      where: {
        id: series.id
      },
      data: {
        nextNumber: sequence + 1,
        updatedAt: issuedAt
      }
    });

    const issuedInvoice = await transaction.invoice.update({
      where: {
        id: invoice.id
      },
      data: {
        status: "issued",
        number,
        variableSymbol,
        issueSnapshotJson: JSON.stringify(issueSnapshot),
        updatedAt: issuedAt
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
        action: "invoice_issued",
        actorId: null,
        occurredAt: issuedAt,
        oldValueJson: JSON.stringify({
          status: invoice.status,
          number: invoice.number
        }),
        newValueJson: JSON.stringify({
          status: issuedInvoice.status,
          number: issuedInvoice.number,
          variableSymbol: issuedInvoice.variableSymbol
        }),
        reason: "Invoice issued",
        previousHash: null,
        currentHash: null
      }
    });

    return issuedInvoice;
  });
}
