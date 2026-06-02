import { prisma } from "../lib/prisma";
import { createDraftInvoice } from "../lib/invoices/create-draft-invoice";
import { createInvoiceEmailOutbox } from "../lib/invoices/create-invoice-email-outbox";
import { createInvoicePdfRender } from "../lib/invoices/create-invoice-pdf-render";
import { issueInvoice } from "../lib/invoices/issue-invoice";
import { processNextInvoiceEmailJob } from "../lib/invoices/process-invoice-email-job";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const testInvoiceId = "81818181-8181-4818-8818-818181818181";
const createAuditEventId = "82828282-8282-4828-8828-828282828282";
const issueAuditEventId = "83838383-8383-4838-8838-838383838383";
const pdfVersionId = "84848484-8484-4848-8848-848484848484";
const emailEventId = "85858585-8585-4858-8858-858585858585";
const emailJobId = "86868686-8686-4868-8868-868686868686";
const emailLogId = "87878787-8787-4878-8878-878787878787";
const workerLogId = "88888888-8888-4888-8888-888888888888";

async function main() {
  await prisma.emailLog.deleteMany({
    where: {
      id: workerLogId
    }
  });
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
    issueDate: "2026-06-25",
    deliveryDate: "2026-06-25",
    dueDate: "2026-07-09",
    vatMode: "payer",
    createdAt: new Date("2026-06-25T08:00:00Z"),
    items: [
      {
        id: "89898989-8989-4898-8898-898989898989",
        description: "Email worker test",
        quantity: 1,
        unit: "ks",
        unitPriceNet: 125,
        vatRateCode: "SK-23",
        vatTreatmentCode: "domestic_goods_or_services"
      }
    ]
  });

  await issueInvoice({
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    auditEventId: issueAuditEventId,
    issuedAt: new Date("2026-06-25T09:00:00Z")
  });

  const rendered = await createInvoicePdfRender({
    id: pdfVersionId,
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    fileId: "80818181-8081-4818-8818-808181818181",
    createdAt: new Date("2026-06-25T09:01:00Z")
  });

  await createInvoiceEmailOutbox({
    id: emailEventId,
    emailJobId,
    emailLogId,
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    pdfVersionId: rendered.pdfVersion.id,
    to: ["odberatel@example.com"],
    createdAt: new Date("2026-06-25T09:02:00Z")
  });

  const processed = await processNextInvoiceEmailJob({
    organizationId: organizationFixture.organization.id,
    invoiceId: testInvoiceId,
    emailLogId: workerLogId,
    processedAt: new Date("2026-06-25T09:03:00Z")
  });

  if (!processed) {
    throw new Error("Expected queued email job to be processed.");
  }

  if (processed.emailJob.id !== emailJobId) {
    throw new Error("Worker must process the queued email job.");
  }

  if (processed.emailJob.status !== "sent_simulated") {
    throw new Error(`Expected sent_simulated job status, got ${processed.emailJob.status}.`);
  }

  if (processed.emailJob.attemptCount !== 1) {
    throw new Error(`Expected attemptCount 1, got ${processed.emailJob.attemptCount}.`);
  }

  if (processed.emailLog.status !== "sent_simulated") {
    throw new Error(`Expected sent_simulated log status, got ${processed.emailLog.status}.`);
  }

  const auditEvent = await prisma.auditEvent.findFirst({
    where: {
      organizationId: organizationFixture.organization.id,
      entityType: "invoice",
      entityId: testInvoiceId,
      action: "invoice_email_sent_simulated"
    }
  });

  if (!auditEvent) {
    throw new Error("Simulated email worker must create an audit event.");
  }

  console.log(
    JSON.stringify(
      {
        invoiceId: testInvoiceId,
        emailJobId: processed.emailJob.id,
        emailJobStatus: processed.emailJob.status,
        emailLogStatus: processed.emailLog.status,
        attemptCount: processed.emailJob.attemptCount,
        auditAction: auditEvent.action
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
