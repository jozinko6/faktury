import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

async function main() {
  const draftResponse = await fetch("http://127.0.0.1:3100/api/invoices/drafts", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      customerId: partnerFixture.partner.id,
      issueDate: "2026-06-01",
      deliveryDate: "2026-06-01",
      dueDate: "2026-06-15",
      vatMode: "payer",
      items: [
        {
          description: "API vystavenie faktury",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 300,
          vatRateCode: "SK-23",
          vatTreatmentCode: "domestic_goods_or_services"
        }
      ]
    })
  });

  const draftPayload = (await draftResponse.json()) as {
    invoice?: {
      id: string;
      status: string;
      number: string | null;
    };
    error?: string;
  };

  if (draftResponse.status !== 201 || !draftPayload.invoice) {
    throw new Error(`Expected draft invoice, got ${draftResponse.status}: ${draftPayload.error}`);
  }

  if (draftPayload.invoice.number !== null) {
    throw new Error("Draft invoice must not have a number before API issue.");
  }

  const issueResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/issue`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        organizationId: organizationFixture.organization.id
      })
    }
  );

  const issuePayload = (await issueResponse.json()) as {
    invoice?: {
      id: string;
      status: string;
      number: string | null;
      variableSymbol: string | null;
      grossTotal: number;
      itemCount: number;
      snapshotCreated: boolean;
    };
    error?: string;
  };

  if (issueResponse.status !== 200 || !issuePayload.invoice) {
    throw new Error(`Expected issued invoice, got ${issueResponse.status}: ${issuePayload.error}`);
  }

  if (issuePayload.invoice.status !== "issued") {
    throw new Error(`Expected issued status, got ${issuePayload.invoice.status}.`);
  }

  if (!issuePayload.invoice.number?.startsWith("FV2026")) {
    throw new Error(`Expected FV2026 number, got ${issuePayload.invoice.number}.`);
  }

  if (!issuePayload.invoice.variableSymbol) {
    throw new Error("Issued invoice must have a variable symbol.");
  }

  if (!issuePayload.invoice.snapshotCreated) {
    throw new Error("Issued invoice must have a snapshot.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: issueResponse.status,
        invoiceId: issuePayload.invoice.id,
        status: issuePayload.invoice.status,
        number: issuePayload.invoice.number,
        variableSymbol: issuePayload.invoice.variableSymbol,
        grossTotal: issuePayload.invoice.grossTotal,
        snapshotCreated: issuePayload.invoice.snapshotCreated
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
