import { prisma } from "../lib/prisma";
import { createDraftInvoice } from "../lib/invoices/create-draft-invoice";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const testInvoiceId = "66666666-6666-4666-8666-666666666666";
const testAuditEventId = "77777777-7777-4777-8777-777777777777";

async function main() {
  await prisma.auditEvent.deleteMany({
    where: {
      id: testAuditEventId
    }
  });
  await prisma.invoice.deleteMany({
    where: {
      id: testInvoiceId
    }
  });

  const invoice = await createDraftInvoice({
    id: testInvoiceId,
    auditEventId: testAuditEventId,
    organizationId: organizationFixture.organization.id,
    customerId: partnerFixture.partner.id,
    issueDate: "2026-02-01",
    deliveryDate: "2026-02-01",
    dueDate: "2026-02-15",
    vatMode: "payer",
    createdAt: new Date("2026-02-01T08:00:00Z"),
    items: [
      {
        id: "88888888-8888-4888-8888-888888888888",
        description: "Implementacne prace",
        quantity: 2,
        unit: "hod",
        unitPriceNet: 50,
        vatRateCode: "SK-23",
        vatTreatmentCode: "domestic_goods_or_services"
      }
    ]
  });

  if (invoice.status !== "draft") {
    throw new Error(`Expected draft invoice, got ${invoice.status}.`);
  }

  if (invoice.number !== null) {
    throw new Error("Draft invoice must not receive an invoice number.");
  }

  if (invoice.grossTotal.toNumber() !== 123) {
    throw new Error(`Expected gross total 123, got ${invoice.grossTotal.toString()}.`);
  }

  const auditEvent = await prisma.auditEvent.findUnique({
    where: {
      id: testAuditEventId
    }
  });

  if (!auditEvent || auditEvent.action !== "invoice_draft_created") {
    throw new Error("Draft invoice audit event was not created.");
  }

  console.log(
    JSON.stringify(
      {
        invoiceId: invoice.id,
        status: invoice.status,
        number: invoice.number,
        grossTotal: invoice.grossTotal.toNumber(),
        itemCount: invoice.items.length,
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
