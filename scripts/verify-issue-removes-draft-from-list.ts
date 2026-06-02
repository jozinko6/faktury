import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

async function readDraftIds() {
  const response = await fetch(
    `http://127.0.0.1:3100/api/invoices/drafts?organizationId=${organizationFixture.organization.id}`
  );
  const payload = (await response.json()) as {
    invoices?: Array<{ id: string }>;
    error?: string;
  };

  if (response.status !== 200 || !payload.invoices) {
    throw new Error(`Expected draft list, got ${response.status}: ${payload.error}`);
  }

  return payload.invoices.map((invoice) => invoice.id);
}

async function main() {
  const draftResponse = await fetch("http://127.0.0.1:3100/api/invoices/drafts", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      customerId: partnerFixture.partner.id,
      issueDate: "2026-06-02",
      deliveryDate: "2026-06-02",
      dueDate: "2026-06-16",
      vatMode: "payer",
      items: [
        {
          description: "UI issue list overenie",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 50,
          vatRateCode: "SK-23",
          vatTreatmentCode: "domestic_goods_or_services"
        }
      ]
    })
  });
  const draftPayload = (await draftResponse.json()) as {
    invoice?: { id: string; number: string | null };
    error?: string;
  };

  if (draftResponse.status !== 201 || !draftPayload.invoice) {
    throw new Error(`Expected created draft, got ${draftResponse.status}: ${draftPayload.error}`);
  }

  const beforeIssueIds = await readDraftIds();
  if (!beforeIssueIds.includes(draftPayload.invoice.id)) {
    throw new Error("Created draft invoice is missing from draft list before issue.");
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
    invoice?: { id: string; status: string; number: string | null; snapshotCreated: boolean };
    error?: string;
  };

  if (issueResponse.status !== 200 || !issuePayload.invoice) {
    throw new Error(`Expected issued invoice, got ${issueResponse.status}: ${issuePayload.error}`);
  }

  const afterIssueIds = await readDraftIds();
  if (afterIssueIds.includes(draftPayload.invoice.id)) {
    throw new Error("Issued invoice still appears in the draft list.");
  }

  console.log(
    JSON.stringify(
      {
        issuedInvoiceId: issuePayload.invoice.id,
        status: issuePayload.invoice.status,
        number: issuePayload.invoice.number,
        snapshotCreated: issuePayload.invoice.snapshotCreated,
        draftListBefore: beforeIssueIds.length,
        draftListAfter: afterIssueIds.length
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
