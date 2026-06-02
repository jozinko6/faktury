import { createHash, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";
import { renderInvoicePdf } from "./render-invoice-pdf";

export type CreateInvoicePdfRenderInput = {
  invoiceId: string;
  organizationId: string;
  id?: string;
  auditEventId?: string;
  fileId?: string;
  templateVersion?: string;
  renderVersion?: string;
  createdBy?: string | null;
  createdAt?: Date;
};

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

export function pdfStoragePath(fileId: string) {
  return join(process.cwd(), "storage", "invoice-pdfs", `${fileId}.pdf`);
}

export async function createInvoicePdfRender(
  input: CreateInvoicePdfRenderInput,
  client: PrismaClient = defaultPrisma
) {
  const createdAt = input.createdAt ?? new Date();
  const fileId = input.fileId ?? randomUUID();
  const auditEventId = input.auditEventId ?? randomUUID();

  const result = await client.$transaction(async (transaction) => {
    const invoice = await transaction.invoice.findFirst({
      where: {
        id: input.invoiceId,
        organizationId: input.organizationId
      },
      include: {
        pdfVersions: {
          orderBy: {
            version: "desc"
          },
          take: 1
        }
      }
    });

    if (!invoice) {
      throw new Error("Invoice was not found for the selected organization.");
    }

    if (invoice.status !== "issued") {
      throw new Error(`PDF can only be rendered for issued invoices. Current status: ${invoice.status}.`);
    }

    if (!invoice.issueSnapshotJson) {
      throw new Error("Issued invoice must have a snapshot before PDF can be rendered.");
    }

    const pdfBytes = renderInvoicePdf(invoice.issueSnapshotJson);
    const snapshotHash = sha256(invoice.issueSnapshotJson);
    const pdfHash = sha256(pdfBytes);
    const version = (invoice.pdfVersions[0]?.version ?? 0) + 1;
    const templateVersion = input.templateVersion ?? "sk-invoice-v1";
    const renderVersion = input.renderVersion ?? "minimal-pdf-v1";

    const pdfVersion = await transaction.invoicePdfVersion.create({
      data: {
        id: input.id ?? randomUUID(),
        invoiceId: invoice.id,
        organizationId: input.organizationId,
        version,
        fileId,
        pdfHash,
        snapshotHash,
        templateVersion,
        renderVersion,
        status: "rendered",
        reason: "issue",
        metadataOnly: false,
        createdBy: input.createdBy ?? null,
        createdAt
      }
    });

    await transaction.auditEvent.create({
      data: {
        id: auditEventId,
        organizationId: input.organizationId,
        entityType: "invoice",
        entityId: invoice.id,
        action: "invoice_pdf_rendered",
        actorId: input.createdBy ?? null,
        occurredAt: createdAt,
        oldValueJson: null,
        newValueJson: JSON.stringify({
          pdfVersionId: pdfVersion.id,
          version,
          fileId,
          pdfHash,
          snapshotHash,
          templateVersion,
          renderVersion
        }),
        reason: "Invoice PDF rendered",
        previousHash: null,
        currentHash: null
      }
    });

    return {
      pdfVersion,
      pdfBytes
    };
  });

  const path = pdfStoragePath(result.pdfVersion.fileId);
  await mkdir(join(process.cwd(), "storage", "invoice-pdfs"), { recursive: true });
  await writeFile(path, result.pdfBytes);

  return {
    pdfVersion: result.pdfVersion,
    filePath: path,
    byteLength: result.pdfBytes.byteLength
  };
}
