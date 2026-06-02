import { NextResponse } from "next/server";
import { createInvoicePdfMetadata } from "../../../../../lib/invoices/create-invoice-pdf-metadata";
import {
  renderInvoiceHtmlPreview,
  renderInvoiceText
} from "../../../../../lib/invoices/render-invoice-text";
import { prisma } from "../../../../../lib/prisma";

export const runtime = "nodejs";

function serializePdfMetadata(pdfMetadata: {
  id: string;
  invoiceId: string;
  version: number;
  fileId: string;
  pdfHash: string;
  snapshotHash: string;
  templateVersion: string;
  renderVersion: string;
  status: string;
  reason: string;
  metadataOnly: boolean;
  createdAt?: Date;
}) {
  return {
    id: pdfMetadata.id,
    invoiceId: pdfMetadata.invoiceId,
    version: pdfMetadata.version,
    fileId: pdfMetadata.fileId,
    pdfHash: pdfMetadata.pdfHash,
    snapshotHash: pdfMetadata.snapshotHash,
    templateVersion: pdfMetadata.templateVersion,
    renderVersion: pdfMetadata.renderVersion,
    status: pdfMetadata.status,
    reason: pdfMetadata.reason,
    metadataOnly: pdfMetadata.metadataOnly,
    createdAt: pdfMetadata.createdAt?.toISOString()
  };
}

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

    const pdfMetadata = await createInvoicePdfMetadata({
      invoiceId,
      organizationId: body.organizationId,
      templateVersion:
        typeof body.templateVersion === "string" && body.templateVersion.trim() !== ""
          ? body.templateVersion
          : undefined,
      renderVersion:
        typeof body.renderVersion === "string" && body.renderVersion.trim() !== ""
          ? body.renderVersion
          : undefined
    });
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        organizationId: body.organizationId
      },
      select: {
        issueSnapshotJson: true
      }
    });

    const snapshotJson = invoice?.issueSnapshotJson ?? null;

    return NextResponse.json(
      {
        pdfMetadata: serializePdfMetadata(pdfMetadata),
        textPreview: snapshotJson ? renderInvoiceText(snapshotJson) : null,
        htmlPreview: snapshotJson ? renderInvoiceHtmlPreview(snapshotJson) : null
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invoice PDF metadata could not be created.";
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

  const pdfMetadata = await prisma.invoicePdfVersion.findMany({
    where: {
      invoiceId,
      organizationId
    },
    orderBy: {
      version: "desc"
    }
  });

  return NextResponse.json({
    pdfMetadata: pdfMetadata.map(serializePdfMetadata)
  });
}
