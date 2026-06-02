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
      issueDate: "2026-06-20",
      deliveryDate: "2026-06-20",
      dueDate: "2026-07-04",
      vatMode: "payer",
      items: [
        {
          description: "API PDF metadata test",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 120,
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
    invoice?: { id: string; status: string; snapshotCreated: boolean };
    error?: string;
  };

  if (issueResponse.status !== 200 || !issuePayload.invoice?.snapshotCreated) {
    throw new Error(`Expected issued invoice with snapshot, got ${issueResponse.status}: ${issuePayload.error}`);
  }

  const metadataResponse = await fetch(
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
  const metadataPayload = (await metadataResponse.json()) as {
    pdfMetadata?: {
      invoiceId: string;
      version: number;
      pdfHash: string;
      snapshotHash: string;
      status: string;
      metadataOnly: boolean;
      templateVersion: string;
      renderVersion: string;
    };
    textPreview?: string | null;
    htmlPreview?: string | null;
    error?: string;
  };

  if (metadataResponse.status !== 201 || !metadataPayload.pdfMetadata) {
    throw new Error(
      `Expected PDF metadata response, got ${metadataResponse.status}: ${metadataPayload.error}`
    );
  }

  assertSha256(metadataPayload.pdfMetadata.pdfHash, "pdfHash");
  assertSha256(metadataPayload.pdfMetadata.snapshotHash, "snapshotHash");

  if (!metadataPayload.pdfMetadata.metadataOnly) {
    throw new Error("PDF metadata API must return metadataOnly true.");
  }

  if (
    typeof metadataPayload.textPreview !== "string" ||
    !metadataPayload.textPreview.includes("FAKTURA") ||
    !metadataPayload.textPreview.includes("Variabilny symbol") ||
    !metadataPayload.textPreview.includes("Dodavatel") ||
    !metadataPayload.textPreview.includes("Odberatel")
  ) {
    throw new Error("PDF metadata API must return a Slovak invoice text preview.");
  }

  if (
    typeof metadataPayload.htmlPreview !== "string" ||
    !metadataPayload.htmlPreview.includes("<!doctype html>") ||
    !metadataPayload.htmlPreview.includes("<html lang=\"sk\">") ||
    !metadataPayload.htmlPreview.includes("FAKTURA") ||
    !metadataPayload.htmlPreview.includes("Variabilny symbol")
  ) {
    throw new Error("PDF metadata API must return a Slovak invoice HTML preview.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: metadataResponse.status,
        invoiceId: metadataPayload.pdfMetadata.invoiceId,
        version: metadataPayload.pdfMetadata.version,
        status: metadataPayload.pdfMetadata.status,
        metadataOnly: metadataPayload.pdfMetadata.metadataOnly,
        pdfHashLength: metadataPayload.pdfMetadata.pdfHash.length,
        snapshotHashLength: metadataPayload.pdfMetadata.snapshotHash.length,
        templateVersion: metadataPayload.pdfMetadata.templateVersion,
        renderVersion: metadataPayload.pdfMetadata.renderVersion,
        textPreviewLength: metadataPayload.textPreview.length,
        htmlPreviewLength: metadataPayload.htmlPreview.length
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
