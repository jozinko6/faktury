import { NextResponse } from "next/server";
import { createInvoiceEmailOutbox } from "../../../../../lib/invoices/create-invoice-email-outbox";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializeOutbox(result: Awaited<ReturnType<typeof createInvoiceEmailOutbox>>) {
  return {
    event: {
      id: result.event.id,
      invoiceId: result.event.invoiceId,
      invoiceNumber: result.event.invoiceNumber,
      pdfVersionId: result.event.pdfVersionId,
      occurredAt: result.event.occurredAt.toISOString()
    },
    emailJob: {
      id: result.emailJob.id,
      invoiceId: result.emailJob.invoiceId,
      pdfVersionId: result.emailJob.pdfVersionId,
      templateCode: result.emailJob.templateCode,
      language: result.emailJob.language,
      to: JSON.parse(result.emailJob.toJson) as string[],
      subject: result.emailJob.subject,
      status: result.emailJob.status,
      attemptCount: result.emailJob.attemptCount,
      maxAttempts: result.emailJob.maxAttempts,
      attachmentFileIds: JSON.parse(result.emailJob.attachmentFileIdsJson) as string[],
      createdAt: result.emailJob.createdAt.toISOString()
    },
    emailLog: {
      id: result.emailLog.id,
      emailJobId: result.emailLog.emailJobId,
      status: result.emailLog.status,
      createdAt: result.emailLog.createdAt.toISOString()
    }
  };
}

function serializeEmailJob(job: {
  id: string;
  invoiceId: string;
  pdfVersionId: string | null;
  templateCode: string;
  language: string;
  toJson: string;
  subject: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  attachmentFileIdsJson: string;
  createdAt: Date;
  logs: Array<{
    id: string;
    status: string;
    createdAt: Date;
  }>;
}) {
  return {
    id: job.id,
    invoiceId: job.invoiceId,
    pdfVersionId: job.pdfVersionId,
    templateCode: job.templateCode,
    language: job.language,
    to: JSON.parse(job.toJson) as string[],
    subject: job.subject,
    status: job.status,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    attachmentFileIds: JSON.parse(job.attachmentFileIdsJson) as string[],
    createdAt: job.createdAt.toISOString(),
    latestLog: job.logs[0]
      ? {
          id: job.logs[0].id,
          status: job.logs[0].status,
          createdAt: job.logs[0].createdAt.toISOString()
        }
      : null
  };
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

    if (typeof body.pdfVersionId !== "string") {
      return NextResponse.json(
        {
          error: "Field pdfVersionId is required."
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.to) || body.to.some((email) => typeof email !== "string")) {
      return NextResponse.json(
        {
          error: "Field to must be an array of email addresses."
        },
        { status: 400 }
      );
    }

    const result = await createInvoiceEmailOutbox({
      invoiceId,
      organizationId: body.organizationId,
      pdfVersionId: body.pdfVersionId,
      to: body.to
    });

    return NextResponse.json(serializeOutbox(result), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invoice email outbox could not be queued.";
    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ invoiceId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const { invoiceId } = await context.params;

  if (!organizationId) {
    return NextResponse.json(
      {
        error: "Query parameter organizationId is required."
      },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      organizationId
    },
    select: {
      id: true
    }
  });

  if (!invoice) {
    return NextResponse.json(
      {
        error: "Invoice was not found for the selected organization."
      },
      { status: 404 }
    );
  }

  const emailJobs = await prisma.emailJob.findMany({
    where: {
      invoiceId,
      organizationId
    },
    include: {
      logs: {
        orderBy: {
          createdAt: "desc"
        },
        take: 1
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({
    emailJobs: emailJobs.map(serializeEmailJob)
  });
}
