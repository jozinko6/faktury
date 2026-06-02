import { prisma } from "../lib/prisma";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

async function main() {
  const response = await fetch("http://127.0.0.1:3100/api/invoices/drafts", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      customerId: partnerFixture.partner.id,
      issueDate: "2026-03-01",
      deliveryDate: "2026-03-01",
      dueDate: "2026-03-15",
      vatMode: "payer",
      items: [
        {
          description: "API overenie draft faktury",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 200,
          vatRateCode: "SK-23",
          vatTreatmentCode: "domestic_goods_or_services"
        }
      ]
    })
  });

  const payload = (await response.json()) as {
    invoice?: {
      id: string;
      status: string;
      number: string | null;
      grossTotal: number;
      itemCount: number;
    };
    error?: string;
  };

  if (response.status !== 201 || !payload.invoice) {
    throw new Error(`Expected 201 invoice response, got ${response.status}: ${payload.error}`);
  }

  if (payload.invoice.status !== "draft") {
    throw new Error(`Expected draft invoice, got ${payload.invoice.status}.`);
  }

  if (payload.invoice.number !== null) {
    throw new Error("API draft invoice must not receive an invoice number.");
  }

  if (payload.invoice.grossTotal !== 246) {
    throw new Error(`Expected gross total 246, got ${payload.invoice.grossTotal}.`);
  }

  const auditEvent = await prisma.auditEvent.findFirst({
    where: {
      entityType: "invoice",
      entityId: payload.invoice.id,
      action: "invoice_draft_created"
    }
  });

  if (!auditEvent) {
    throw new Error("API draft invoice audit event was not created.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: response.status,
        invoiceId: payload.invoice.id,
        status: payload.invoice.status,
        number: payload.invoice.number,
        grossTotal: payload.invoice.grossTotal,
        itemCount: payload.invoice.itemCount,
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
