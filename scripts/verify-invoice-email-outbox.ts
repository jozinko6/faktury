import { prisma } from "../lib/prisma";
import { createDraftInvoice } from "../lib/invoices/create-draft-invoice";
import { createInvoiceEmailOutbox } from "../lib/invoices/create-invoice-email-outbox";
import { createInvoicePdfRender } from "../lib/invoices/create-invoice-pdf-render";
import { issueInvoice } from "../lib/invoices/issue-invoice";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const testInvoiceId = "91919191-9191-4919-8919-919191919191";
const createAuditEventId = "92929292-9292-4929-8929-929292929292";
const issueAuditEventId = "93939393-9393-4939-8939-939393939393";
const pdfVersionId = "94949494-9494-4949-8949-949494949494";
const emailEventId = "95959595-9595-4959-8959-959595959595";
const emailJobId = "96969696-9696-4969-8969-969696969696";
const emailLogId = "97979797-9797-4979-8979-979797979797";

async function main() {
  await prisma.invoice.deleteMany({
    where: {
      id: testInvoiceId
    }
  });
  await prisma.auditEvent.deleteMany({
    where: {
      id: {
        in: [createAuditEventId, issueAuditEventId]
      }
    }
  });

  await createDraftInvoice({
    id: testInvoiceId,
    auditEventId: createAuditEventId,
    organizationId: organizationFixture.organization.id,
    customerId: partnerFixture.partner.id,
    issueDate: "2026-06-23",
    deliveryDate: "2026-06-23",
    dueDate: "2026-07-07",
    vatMode: "payer",
    createdAt: new Date("2026-06-23T08:00:00Z"),
    items: [
      {
        id: "98989898-9898-4989-8989-989898989898",
        description: "Email outbox test",
        quantity: 1,
        unit: "ks",
        unitPriceNet: 110,
        vatRateCode: "SK-23",
        vatTreatmentCode: "domestic_goods_or_services"
      }
    ]
  });

  const issued = await issueInvoice({
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    auditEventId: issueAuditEventId,
    issuedAt: new Date("2026-06-23T09:00:00Z")
  });

  const rendered = await createInvoicePdfRender({
    id: pdfVersionId,
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    fileId: "90919191-9091-4919-8919-909191919191",
    createdAt: new Date("2026-06-23T09:01:00Z")
  });

  const outbox = await createInvoiceEmailOutbox({
    id: emailEventId,
    emailJobId,
    emailLogId,
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    pdfVersionId: rendered.pdfVersion.id,
    to: ["odberatel@example.com"],
    createdAt: new Date("2026-06-23T09:02:00Z")
  });

  if (outbox.event.invoiceNumber !== issued.number) {
    throw new Error("Email outbox event must snapshot the issued invoice number.");
  }

  if (outbox.emailJob.status !== "queued") {
    throw new Error(`Expected queued email job, got ${outbox.emailJob.status}.`);
  }

  if (outbox.emailJob.templateCode !== "invoice_send") {
    throw new Error(`Expected invoice_send template, got ${outbox.emailJob.templateCode}.`);
  }

  if (outbox.emailJob.pdfVersionId !== rendered.pdfVersion.id) {
    throw new Error("Email job must reference the rendered PDF version.");
  }

  const recipients = JSON.parse(outbox.emailJob.toJson) as string[];
  const attachmentFileIds = JSON.parse(outbox.emailJob.attachmentFileIdsJson) as string[];

  if (recipients[0] !== "odberatel@example.com") {
    throw new Error("Email job must store recipients in toJson.");
  }

  if (attachmentFileIds[0] !== rendered.pdfVersion.fileId) {
    throw new Error("Email job must attach the rendered PDF fileId.");
  }

  if (outbox.emailLog.status !== "queued") {
    throw new Error(`Expected queued email log, got ${outbox.emailLog.status}.`);
  }

  console.log(
    JSON.stringify(
      {
        invoiceId: testInvoiceId,
        invoiceNumber: outbox.event.invoiceNumber,
        eventId: outbox.event.id,
        emailJobStatus: outbox.emailJob.status,
        emailLogStatus: outbox.emailLog.status,
        templateCode: outbox.emailJob.templateCode,
        attachmentCount: attachmentFileIds.length
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
