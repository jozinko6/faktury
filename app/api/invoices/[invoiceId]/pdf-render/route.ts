import { NextResponse } from "next/server";
import { createInvoicePdfRender } from "../../../../../lib/invoices/create-invoice-pdf-render";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function serializePdfRender(result: Awaited<ReturnType<typeof createInvoicePdfRender>>) {
  return {
    pdfVersion: {
      id: result.pdfVersion.id,
      invoiceId: result.pdfVersion.invoiceId,
      version: result.pdfVersion.version,
      fileId: result.pdfVersion.fileId,
      pdfHash: result.pdfVersion.pdfHash,
      snapshotHash: result.pdfVersion.snapshotHash,
      templateVersion: result.pdfVersion.templateVersion,
      renderVersion: result.pdfVersion.renderVersion,
      status: result.pdfVersion.status,
      reason: result.pdfVersion.reason,
      metadataOnly: result.pdfVersion.metadataOnly,
      createdAt: result.pdfVersion.createdAt.toISOString()
    },
    filePath: result.filePath,
    byteLength: result.byteLength
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

    const result = await createInvoicePdfRender({
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

    return NextResponse.json(serializePdfRender(result), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invoice PDF could not be rendered.";
    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
