import { readFile } from "node:fs/promises";
import { prisma } from "../lib/prisma";
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
      issueDate: "2026-06-22",
      deliveryDate: "2026-06-22",
      dueDate: "2026-07-06",
      vatMode: "payer",
      items: [
        {
          description: "API PDF render test",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 140,
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

  const renderResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/pdf-render`,
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
  const renderPayload = (await renderResponse.json()) as {
    pdfVersion?: {
      invoiceId: string;
      version: number;
      fileId: string;
      pdfHash: string;
      snapshotHash: string;
      status: string;
      metadataOnly: boolean;
      renderVersion: string;
    };
    filePath?: string;
    byteLength?: number;
    error?: string;
  };

  if (renderResponse.status !== 201 || !renderPayload.pdfVersion || !renderPayload.filePath) {
    throw new Error(`Expected rendered PDF response, got ${renderResponse.status}: ${renderPayload.error}`);
  }

  assertSha256(renderPayload.pdfVersion.pdfHash, "pdfHash");
  assertSha256(renderPayload.pdfVersion.snapshotHash, "snapshotHash");

  if (renderPayload.pdfVersion.metadataOnly) {
    throw new Error("Rendered PDF version must not be metadata-only.");
  }

  if (renderPayload.pdfVersion.status !== "rendered") {
    throw new Error(`Expected rendered status, got ${renderPayload.pdfVersion.status}.`);
  }

  const pdfBytes = await readFile(renderPayload.filePath);

  if (!pdfBytes.subarray(0, 8).toString("latin1").startsWith("%PDF-1.")) {
    throw new Error("Rendered artifact must start with a PDF header.");
  }

  if (pdfBytes.byteLength !== renderPayload.byteLength) {
    throw new Error("Rendered artifact byte length must match API response.");
  }

  const downloadResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/pdf-render/${renderPayload.pdfVersion.fileId}?organizationId=${organizationFixture.organization.id}`
  );
  const downloadedBytes = Buffer.from(await downloadResponse.arrayBuffer());

  if (downloadResponse.status !== 200) {
    throw new Error(`Expected rendered PDF download, got ${downloadResponse.status}.`);
  }

  if (downloadResponse.headers.get("content-type") !== "application/pdf") {
    throw new Error(`Expected application/pdf content type, got ${downloadResponse.headers.get("content-type")}.`);
  }

  if (downloadResponse.headers.get("x-invoice-pdf-hash") !== renderPayload.pdfVersion.pdfHash) {
    throw new Error("Downloaded PDF hash header must match rendered metadata.");
  }

  if (downloadedBytes.compare(pdfBytes) !== 0) {
    throw new Error("Downloaded PDF bytes must match stored artifact bytes.");
  }

  const auditEvent = await prisma.auditEvent.findFirst({
    where: {
      organizationId: organizationFixture.organization.id,
      entityType: "invoice",
      entityId: draftPayload.invoice.id,
      action: "invoice_pdf_rendered"
    },
    orderBy: {
      occurredAt: "desc"
    }
  });

  if (!auditEvent?.newValueJson) {
    throw new Error("PDF render must create an invoice_pdf_rendered audit event.");
  }

  const auditPayload = JSON.parse(auditEvent.newValueJson) as {
    fileId?: string;
    pdfHash?: string;
    snapshotHash?: string;
    renderVersion?: string;
  };

  if (
    auditPayload.fileId !== renderPayload.pdfVersion.fileId ||
    auditPayload.pdfHash !== renderPayload.pdfVersion.pdfHash ||
    auditPayload.snapshotHash !== renderPayload.pdfVersion.snapshotHash ||
    auditPayload.renderVersion !== renderPayload.pdfVersion.renderVersion
  ) {
    throw new Error("PDF render audit event must reference rendered metadata.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: renderResponse.status,
        invoiceId: renderPayload.pdfVersion.invoiceId,
        version: renderPayload.pdfVersion.version,
        status: renderPayload.pdfVersion.status,
        metadataOnly: renderPayload.pdfVersion.metadataOnly,
        pdfHashLength: renderPayload.pdfVersion.pdfHash.length,
        snapshotHashLength: renderPayload.pdfVersion.snapshotHash.length,
        renderVersion: renderPayload.pdfVersion.renderVersion,
        byteLength: renderPayload.byteLength,
        downloadStatus: downloadResponse.status,
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
