import { prisma } from "../lib/prisma";
import { createDraftInvoice } from "../lib/invoices/create-draft-invoice";
import { issueInvoice } from "../lib/invoices/issue-invoice";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const testInvoiceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const createAuditEventId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const issueAuditEventId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

async function main() {
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

  const draft = await createDraftInvoice({
    id: testInvoiceId,
    auditEventId: createAuditEventId,
    organizationId: organizationFixture.organization.id,
    customerId: partnerFixture.partner.id,
    issueDate: "2026-05-01",
    deliveryDate: "2026-05-01",
    dueDate: "2026-05-15",
    vatMode: "payer",
    createdAt: new Date("2026-05-01T08:00:00Z"),
    items: [
      {
        id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        description: "Vystavenie faktury test",
        quantity: 1,
        unit: "ks",
        unitPriceNet: 100,
        vatRateCode: "SK-23",
        vatTreatmentCode: "domestic_goods_or_services"
      }
    ]
  });

  if (draft.number !== null) {
    throw new Error("Draft invoice unexpectedly has a number before issue.");
  }

  const issued = await issueInvoice({
    invoiceId: testInvoiceId,
    organizationId: organizationFixture.organization.id,
    auditEventId: issueAuditEventId,
    issuedAt: new Date("2026-05-01T09:00:00Z")
  });

  if (issued.status !== "issued") {
    throw new Error(`Expected issued status, got ${issued.status}.`);
  }

  if (!issued.number?.startsWith("FV2026")) {
    throw new Error(`Expected FV2026 invoice number, got ${issued.number}.`);
  }

  if (!issued.variableSymbol || issued.variableSymbol.length === 0) {
    throw new Error("Issued invoice must have a variable symbol.");
  }

  if (!issued.issueSnapshotJson) {
    throw new Error("Issued invoice must have an issue snapshot.");
  }

  const auditEvent = await prisma.auditEvent.findUnique({
    where: {
      id: issueAuditEventId
    }
  });

  if (!auditEvent || auditEvent.action !== "invoice_issued") {
    throw new Error("Invoice issue audit event was not created.");
  }

  console.log(
    JSON.stringify(
      {
        invoiceId: issued.id,
        status: issued.status,
        number: issued.number,
        variableSymbol: issued.variableSymbol,
        snapshotCreated: Boolean(issued.issueSnapshotJson),
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
