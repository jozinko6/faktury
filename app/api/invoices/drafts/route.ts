import { NextResponse } from "next/server";
import {
  createDraftInvoice,
  type CreateDraftInvoiceInput,
  type CreateDraftInvoiceItemInput
} from "../../../../lib/invoices/create-draft-invoice";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

function serializeInvoice(invoice: {
  id: string;
  status: string;
  number: string | null;
  currency: string;
  netTotal: { toNumber(): number };
  vatTotal: { toNumber(): number };
  grossTotal: { toNumber(): number };
  remainingBalance: { toNumber(): number };
  items: unknown[];
  createdAt?: Date;
}) {
  return {
    id: invoice.id,
    status: invoice.status,
    number: invoice.number,
    currency: invoice.currency,
    netTotal: invoice.netTotal.toNumber(),
    vatTotal: invoice.vatTotal.toNumber(),
    grossTotal: invoice.grossTotal.toNumber(),
    remainingBalance: invoice.remainingBalance.toNumber(),
    itemCount: invoice.items.length,
    createdAt: invoice.createdAt?.toISOString()
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(body: Record<string, unknown>, field: string) {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Field ${field} is required.`);
  }
  return value;
}

function parseItems(value: unknown): CreateDraftInvoiceItemInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Field items must contain at least one item.");
  }

  return value.map((rawItem, index) => {
    if (!isRecord(rawItem)) {
      throw new Error(`Item ${index + 1} must be an object.`);
    }

    const description = rawItem.description;
    const quantity = rawItem.quantity;
    const unit = rawItem.unit;
    const unitPriceNet = rawItem.unitPriceNet;
    const vatRateCode = rawItem.vatRateCode;
    const vatTreatmentCode = rawItem.vatTreatmentCode;
    const discountPercent = rawItem.discountPercent;

    if (typeof description !== "string" || description.trim() === "") {
      throw new Error(`Item ${index + 1} description is required.`);
    }

    if (typeof quantity !== "number") {
      throw new Error(`Item ${index + 1} quantity must be a number.`);
    }

    if (typeof unit !== "string" || unit.trim() === "") {
      throw new Error(`Item ${index + 1} unit is required.`);
    }

    if (typeof unitPriceNet !== "number") {
      throw new Error(`Item ${index + 1} unitPriceNet must be a number.`);
    }

    if (
      vatRateCode !== "SK-23" &&
      vatRateCode !== "SK-19" &&
      vatRateCode !== "SK-5" &&
      vatRateCode !== "SK-0" &&
      vatRateCode !== "SK-RC"
    ) {
      throw new Error(`Item ${index + 1} has unsupported vatRateCode.`);
    }

    if (typeof vatTreatmentCode !== "string" || vatTreatmentCode.trim() === "") {
      throw new Error(`Item ${index + 1} vatTreatmentCode is required.`);
    }

    return {
      description,
      quantity,
      unit,
      unitPriceNet,
      discountPercent: typeof discountPercent === "number" ? discountPercent : undefined,
      vatRateCode,
      vatTreatmentCode
    };
  });
}

function parseCreateDraftInvoiceInput(body: unknown): CreateDraftInvoiceInput {
  if (!isRecord(body)) {
    throw new Error("Request body must be an object.");
  }

  return {
    organizationId: requireString(body, "organizationId"),
    customerId: requireString(body, "customerId"),
    issueDate: requireString(body, "issueDate"),
    deliveryDate: requireString(body, "deliveryDate"),
    dueDate: requireString(body, "dueDate"),
    paymentMethod:
      typeof body.paymentMethod === "string" && body.paymentMethod.trim() !== ""
        ? body.paymentMethod
        : undefined,
    vatMode: requireString(body, "vatMode"),
    items: parseItems(body.items)
  };
}

export async function POST(request: Request) {
  try {
    const input = parseCreateDraftInvoiceInput(await request.json());
    const invoice = await createDraftInvoice(input);

    return NextResponse.json(
      {
        invoice: serializeInvoice(invoice)
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Draft invoice could not be created.";
    const status = message.includes("does not belong") ? 404 : 400;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      {
        error: "Query parameter organizationId is required."
      },
      { status: 400 }
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: "draft"
    },
    include: {
      items: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 20
  });

  return NextResponse.json({
    invoices: invoices.map(serializeInvoice)
  });
}
