import { NextResponse } from "next/server";
import { issueInvoice } from "../../../../../lib/invoices/issue-invoice";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const body = await request.json();
    const { invoiceId } = await context.params;

    if (!isRecord(body) || typeof body.organizationId !== "string") {
      return NextResponse.json(
        {
          error: "Field organizationId is required."
        },
        { status: 400 }
      );
    }

    const invoice = await issueInvoice({
      invoiceId,
      organizationId: body.organizationId
    });

    return NextResponse.json({
      invoice: {
        id: invoice.id,
        status: invoice.status,
        number: invoice.number,
        variableSymbol: invoice.variableSymbol,
        grossTotal: invoice.grossTotal.toNumber(),
        remainingBalance: invoice.remainingBalance.toNumber(),
        itemCount: invoice.items.length,
        snapshotCreated: Boolean(invoice.issueSnapshotJson)
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invoice could not be issued.";
    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
