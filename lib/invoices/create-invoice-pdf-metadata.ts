import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export type CreateInvoicePdfMetadataInput = {
  invoiceId: string;
  organizationId: string;
  id?: string;
  fileId?: string;
  templateVersion?: string;
  renderVersion?: string;
  createdBy?: string | null;
  createdAt?: Date;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function createInvoicePdfMetadata(
  input: CreateInvoicePdfMetadataInput,
  client: PrismaClient = defaultPrisma
) {
  const createdAt = input.createdAt ?? new Date();

  return client.$transaction(async (transaction) => {
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
      throw new Error(`PDF metadata can only be prepared for issued invoices. Current status: ${invoice.status}.`);
    }

    if (!invoice.issueSnapshotJson) {
      throw new Error("Issued invoice must have a snapshot before PDF metadata can be prepared.");
    }

    const version = (invoice.pdfVersions[0]?.version ?? 0) + 1;
    const templateVersion = input.templateVersion ?? "sk-invoice-v1";
    const renderVersion = input.renderVersion ?? "metadata-only-v1";
    const snapshotHash = sha256(invoice.issueSnapshotJson);
    const metadataHashPayload = JSON.stringify({
      mode: "metadata_only",
      invoiceId: invoice.id,
      number: invoice.number,
      snapshotHash,
      templateVersion,
      renderVersion
    });

    return transaction.invoicePdfVersion.create({
      data: {
        id: input.id ?? randomUUID(),
        invoiceId: invoice.id,
        organizationId: input.organizationId,
        version,
        fileId: input.fileId ?? randomUUID(),
        pdfHash: sha256(metadataHashPayload),
        snapshotHash,
        templateVersion,
        renderVersion,
        status: "draft_render",
        reason: "issue",
        metadataOnly: true,
        createdBy: input.createdBy ?? null,
        createdAt
      }
    });
  });
}
