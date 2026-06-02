import { prisma } from "../lib/prisma";
import { createDraftInvoice } from "../lib/invoices/create-draft-invoice";
import { createInvoicePdfMetadata } from "../lib/invoices/create-invoice-pdf-metadata";
import { issueInvoice } from "../lib/invoices/issue-invoice";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const testInvoiceId = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const createAuditEventId = "12121212-1212-4121-8121-121212121212";
const issueAuditEventId = "34343434-3434-4343-8343-343434343434";
const pdfMetadataId = "56565656-5656-4565-8565-565656565656";

function isSha256(value: string) {
  return /^[a-f0-9]{64}$/.test(value);
}

async function main() {
  await prisma.invoicePdfVersion.deleteMany({
    where: {
      id: pdfMetadataId
    }
  });
  await prisma.auditEvent.deleteMany({
    where: {
      id: {
        in: [createAuditEventId, issueAuditEventId]
      }
    }
  });
  await prisma.invoice.deleteMany({
    where: {
      id: testInvoiceId
    }
  });

  await createDraftInvoice({
    id: testInvoiceId,
    auditEventId: createAuditEventId,
    organizationId: organizationFixture.organization.id,
    customerId: partnerFixture.partner.id,
    issueDate: "2026-06-10",
    deliveryDate: "2026-06-10",
    dueDate: "2026-06-24",
    vatMode: "payer",
    createdAt: new Date("2026-06-10T08:00:00Z"),
    items: [
      {
        id: "78787878-7878-4787-8787-787878787878",
        description: "PDF metadata test",
        quantity: 1,
        unit: "ks",
        unitPriceNet: 100,
        vatRateCode: "SK-23",
        vatTreatmentCode: "domestic_goods_or_services"
      }
    ]
  });

  await issueInvoice({
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    auditEventId: issueAuditEventId,
    issuedAt: new Date("2026-06-10T09:00:00Z")
  });

  const pdfMetadata = await createInvoicePdfMetadata({
    id: pdfMetadataId,
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    fileId: "90909090-9090-4909-8909-909090909090",
    createdAt: new Date("2026-06-10T09:01:00Z")
  });

  if (!isSha256(pdfMetadata.snapshotHash)) {
    throw new Error("Snapshot hash must be a SHA-256 hex digest.");
  }

  if (!isSha256(pdfMetadata.pdfHash)) {
    throw new Error("PDF metadata hash must be a SHA-256 hex digest.");
  }

  if (!pdfMetadata.metadataOnly) {
    throw new Error("PDF metadata must be marked as metadata-only until real rendering exists.");
  }

  if (pdfMetadata.status !== "draft_render") {
    throw new Error(`Expected draft_render status, got ${pdfMetadata.status}.`);
  }

  console.log(
    JSON.stringify(
      {
        invoiceId: pdfMetadata.invoiceId,
        version: pdfMetadata.version,
        status: pdfMetadata.status,
        metadataOnly: pdfMetadata.metadataOnly,
        snapshotHashLength: pdfMetadata.snapshotHash.length,
        pdfHashLength: pdfMetadata.pdfHash.length,
        templateVersion: pdfMetadata.templateVersion,
        renderVersion: pdfMetadata.renderVersion
      },
      null,
      2
    )
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
