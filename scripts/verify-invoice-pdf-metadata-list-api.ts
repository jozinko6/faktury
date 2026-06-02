import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

function assertSha256(value: string, label: string) {
  if (!/^[a-f0-9]{64}$/.test(value)) {
    throw new Error(`${label} must be a SHA-256 hex digest.`);
  }
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
      issueDate: "2026-06-21",
      deliveryDate: "2026-06-21",
      dueDate: "2026-07-05",
      vatMode: "payer",
      items: [
        {
          description: "API PDF metadata list test",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 90,
          vatRateCode: "SK-23",
          vatTreatmentCode: "domestic_goods_or_services"
        }
      ]
    })
  });
  const draftPayload = (await draftResponse.json()) as {
    invoice?: { id: string };
    error?: string;
  };

  if (draftResponse.status !== 201 || !draftPayload.invoice) {
    throw new Error(`Expected draft invoice, got ${draftResponse.status}: ${draftPayload.error}`);
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
    invoice?: { snapshotCreated: boolean };
    error?: string;
  };

  if (issueResponse.status !== 200 || !issuePayload.invoice?.snapshotCreated) {
    throw new Error(`Expected issued invoice, got ${issueResponse.status}: ${issuePayload.error}`);
  }

  const createMetadataResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/pdf-metadata`,
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
  const createMetadataPayload = (await createMetadataResponse.json()) as {
    pdfMetadata?: { id: string };
    error?: string;
  };

  if (createMetadataResponse.status !== 201 || !createMetadataPayload.pdfMetadata) {
    throw new Error(
      `Expected created PDF metadata, got ${createMetadataResponse.status}: ${createMetadataPayload.error}`
    );
  }

  const listResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/pdf-metadata?organizationId=${organizationFixture.organization.id}`
  );
  const listPayload = (await listResponse.json()) as {
    pdfMetadata?: Array<{
      id: string;
      version: number;
      pdfHash: string;
      snapshotHash: string;
      status: string;
      metadataOnly: boolean;
    }>;
    error?: string;
  };

  if (listResponse.status !== 200 || !listPayload.pdfMetadata) {
    throw new Error(`Expected PDF metadata list, got ${listResponse.status}: ${listPayload.error}`);
  }

  const created = listPayload.pdfMetadata.find(
    (metadata) => metadata.id === createMetadataPayload.pdfMetadata?.id
  );

  if (!created) {
    throw new Error("Created PDF metadata was not returned by the list endpoint.");
  }

  assertSha256(created.pdfHash, "pdfHash");
  assertSha256(created.snapshotHash, "snapshotHash");

  if (!created.metadataOnly) {
    throw new Error("Listed PDF metadata must be metadataOnly.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: listResponse.status,
        returnedVersions: listPayload.pdfMetadata.length,
        createdVersion: created.version,
        status: created.status,
        metadataOnly: created.metadataOnly,
        pdfHashLength: created.pdfHash.length,
        snapshotHashLength: created.snapshotHash.length
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
