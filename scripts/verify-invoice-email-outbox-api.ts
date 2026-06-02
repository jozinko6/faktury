import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";
import { prisma } from "../lib/prisma";

async function main() {
  const draftResponse = await fetch("http://127.0.0.1:3100/api/invoices/drafts", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      customerId: partnerFixture.partner.id,
      issueDate: "2026-06-24",
      deliveryDate: "2026-06-24",
      dueDate: "2026-07-08",
      vatMode: "payer",
      items: [
        {
          description: "API email outbox test",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 130,
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
    invoice?: { snapshotCreated: boolean; number: string | null };
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
    pdfVersion?: { id: string; fileId: string };
    error?: string;
  };

  if (renderResponse.status !== 201 || !renderPayload.pdfVersion) {
    throw new Error(`Expected rendered PDF, got ${renderResponse.status}: ${renderPayload.error}`);
  }

  const outboxResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/email-outbox`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        organizationId: organizationFixture.organization.id,
        pdfVersionId: renderPayload.pdfVersion.id,
        to: ["odberatel@example.com"]
      })
    }
  );
  const outboxPayload = (await outboxResponse.json()) as {
    event?: {
      invoiceId: string;
      invoiceNumber: string;
      pdfVersionId: string;
    };
    emailJob?: {
      id: string;
      status: string;
      templateCode: string;
      to: string[];
      attachmentFileIds: string[];
    };
    emailLog?: {
      status: string;
    };
    error?: string;
  };

  if (outboxResponse.status !== 201 || !outboxPayload.event || !outboxPayload.emailJob || !outboxPayload.emailLog) {
    throw new Error(`Expected email outbox response, got ${outboxResponse.status}: ${outboxPayload.error}`);
  }

  if (outboxPayload.event.invoiceNumber !== issuePayload.invoice.number) {
    throw new Error("Email outbox API must snapshot the issued invoice number.");
  }

  if (outboxPayload.event.pdfVersionId !== renderPayload.pdfVersion.id) {
    throw new Error("Email outbox API event must reference rendered PDF version.");
  }

  if (outboxPayload.emailJob.status !== "queued" || outboxPayload.emailLog.status !== "queued") {
    throw new Error("Email outbox API must create queued job and log.");
  }

  if (outboxPayload.emailJob.templateCode !== "invoice_send") {
    throw new Error(`Expected invoice_send template, got ${outboxPayload.emailJob.templateCode}.`);
  }

  if (outboxPayload.emailJob.to[0] !== "odberatel@example.com") {
    throw new Error("Email outbox API must return recipients.");
  }

  if (outboxPayload.emailJob.attachmentFileIds[0] !== renderPayload.pdfVersion.fileId) {
    throw new Error("Email outbox API must attach rendered PDF fileId.");
  }

  const listResponse = await fetch(
    `http://127.0.0.1:3100/api/invoices/${draftPayload.invoice.id}/email-outbox?organizationId=${organizationFixture.organization.id}`
  );
  const listPayload = (await listResponse.json()) as {
    emailJobs?: Array<{
      id: string;
      status: string;
      templateCode: string;
      to: string[];
      attachmentFileIds: string[];
      latestLog: {
        status: string;
      } | null;
    }>;
    error?: string;
  };

  if (listResponse.status !== 200 || !listPayload.emailJobs) {
    throw new Error(`Expected email outbox list, got ${listResponse.status}: ${listPayload.error}`);
  }

  const createdJob = listPayload.emailJobs.find((job) => job.id === outboxPayload.emailJob?.id);

  if (!createdJob) {
    throw new Error("Created email outbox job must be returned by list endpoint.");
  }

  if (createdJob.status !== "queued" || createdJob.latestLog?.status !== "queued") {
    throw new Error("Email outbox list must return queued job and latest queued log.");
  }

  const auditEvent = await prisma.auditEvent.findFirst({
    where: {
      organizationId: organizationFixture.organization.id,
      entityType: "invoice",
      entityId: draftPayload.invoice.id,
      action: "invoice_email_outbox_queued"
    },
    orderBy: {
      occurredAt: "desc"
    }
  });

  if (!auditEvent?.newValueJson) {
    throw new Error("Email outbox API must create an invoice_email_outbox_queued audit event.");
  }

  const auditPayload = JSON.parse(auditEvent.newValueJson) as {
    emailJobId?: string;
    pdfVersionId?: string;
    status?: string;
    to?: string[];
  };

  if (
    auditPayload.emailJobId !== outboxPayload.emailJob.id ||
    auditPayload.pdfVersionId !== renderPayload.pdfVersion.id ||
    auditPayload.status !== "queued" ||
    auditPayload.to?.[0] !== "odberatel@example.com"
  ) {
    throw new Error("Email outbox audit payload must reference the queued job.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: outboxResponse.status,
        invoiceId: outboxPayload.event.invoiceId,
        invoiceNumber: outboxPayload.event.invoiceNumber,
        emailJobStatus: outboxPayload.emailJob.status,
        emailLogStatus: outboxPayload.emailLog.status,
        templateCode: outboxPayload.emailJob.templateCode,
        attachmentCount: outboxPayload.emailJob.attachmentFileIds.length,
        listedJobs: listPayload.emailJobs.length,
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
