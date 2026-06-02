import { NextResponse } from "next/server";
import { processNextInvoiceEmailJob } from "../../../../lib/invoices/process-invoice-email-job";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isRecord(body) || typeof body.organizationId !== "string") {
      return NextResponse.json(
        {
          error: "Field organizationId is required."
        },
        { status: 400 }
      );
    }

    const result = await processNextInvoiceEmailJob({
      organizationId: body.organizationId,
      invoiceId: typeof body.invoiceId === "string" ? body.invoiceId : undefined
    });

    if (!result) {
      return NextResponse.json({
        processed: false
      });
    }

    return NextResponse.json({
      processed: true,
      emailJob: {
        id: result.emailJob.id,
        invoiceId: result.emailJob.invoiceId,
        status: result.emailJob.status,
        attemptCount: result.emailJob.attemptCount,
        processedAt: result.emailJob.processedAt?.toISOString() ?? null
      },
      emailLog: {
        id: result.emailLog.id,
        emailJobId: result.emailLog.emailJobId,
        status: result.emailLog.status,
        createdAt: result.emailLog.createdAt.toISOString()
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invoice email worker simulation failed.";

    return NextResponse.json(
      {
        error: message
      },
      { status: 400 }
    );
  }
}
