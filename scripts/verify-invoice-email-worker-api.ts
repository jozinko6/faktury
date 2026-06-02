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
      issueDate: "2026-06-26",
      deliveryDate: "2026-06-26",
      dueDate: "2026-07-10",
      vatMode: "payer",
      items: [
        {
          description: "API email worker test",
          quantity: 1,
          unit: "ks",
          unitPriceNet: 135,
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
    pdfVersion?: { id: string };
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
    emailJob?: { id: string; status: string };
    error?: string;
  };

  if (outboxResponse.status !== 201 || !outboxPayload.emailJob) {
    throw new Error(`Expected email outbox job, got ${outboxResponse.status}: ${outboxPayload.error}`);
  }

  const workerResponse = await fetch("http://127.0.0.1:3100/api/email-worker/simulate", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      invoiceId: draftPayload.invoice.id
    })
  });
  const workerPayload = (await workerResponse.json()) as {
    processed?: boolean;
    emailJob?: {
      id: string;
      status: string;
      attemptCount: number;
    };
    emailLog?: {
      status: string;
    };
    error?: string;
  };

  if (workerResponse.status !== 200 || !workerPayload.processed || !workerPayload.emailJob || !workerPayload.emailLog) {
    throw new Error(`Expected simulated worker result, got ${workerResponse.status}: ${workerPayload.error}`);
  }

  if (workerPayload.emailJob.id !== outboxPayload.emailJob.id) {
    throw new Error("Worker API must process the queued email job.");
  }

  if (workerPayload.emailJob.status !== "sent_simulated" || workerPayload.emailLog.status !== "sent_simulated") {
    throw new Error("Worker API must mark job and log as sent_simulated.");
  }

  if (workerPayload.emailJob.attemptCount !== 1) {
    throw new Error(`Expected attemptCount 1, got ${workerPayload.emailJob.attemptCount}.`);
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: workerResponse.status,
        invoiceId: draftPayload.invoice.id,
        processed: workerPayload.processed,
        emailJobStatus: workerPayload.emailJob.status,
        emailLogStatus: workerPayload.emailLog.status,
        attemptCount: workerPayload.emailJob.attemptCount
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
