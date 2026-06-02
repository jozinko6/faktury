import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { pdfStoragePath } from "../../../../../../lib/invoices/create-invoice-pdf-render";
import { prisma } from "../../../../../../lib/prisma";

export const runtime = "nodejs";

function sha256(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function pdfFileName(invoiceNumber: string | null, fileId: string) {
  const baseName = invoiceNumber ? invoiceNumber.replace(/[^A-Za-z0-9_-]/g, "-") : fileId;

  return `${baseName}.pdf`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ invoiceId: string; fileId: string }> }
) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const { invoiceId, fileId } = await context.params;

  if (!organizationId) {
    return NextResponse.json(
      {
        error: "Query parameter organizationId is required."
      },
      { status: 400 }
    );
  }

  const pdfVersion = await prisma.invoicePdfVersion.findFirst({
    where: {
      invoiceId,
      organizationId,
      fileId,
      metadataOnly: false,
      status: "rendered"
    },
    include: {
      invoice: {
        select: {
          number: true
        }
      }
    }
  });

  if (!pdfVersion) {
    return NextResponse.json(
      {
        error: "Rendered PDF artifact was not found for the selected organization."
      },
      { status: 404 }
    );
  }

  let pdfBytes: Buffer;

  try {
    pdfBytes = await readFile(pdfStoragePath(fileId));
  } catch {
    return NextResponse.json(
      {
        error: "Rendered PDF artifact file is missing."
      },
      { status: 404 }
    );
  }

  if (sha256(pdfBytes) !== pdfVersion.pdfHash) {
    return NextResponse.json(
      {
        error: "Rendered PDF artifact hash does not match stored metadata."
      },
      { status: 409 }
    );
  }

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${pdfFileName(pdfVersion.invoice.number, fileId)}"`,
      "content-length": pdfBytes.byteLength.toString(),
      "x-invoice-pdf-hash": pdfVersion.pdfHash
    }
  });
}
