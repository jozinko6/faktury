"use client";

import { useEffect, useState } from "react";

type DraftInvoiceResult = {
  id: string;
  status: string;
  number: string | null;
  variableSymbol?: string | null;
  grossTotal: number;
  remainingBalance: number;
  itemCount: number;
  snapshotCreated?: boolean;
};

type PdfMetadataResult = {
  id: string;
  invoiceId?: string;
  version: number;
  fileId?: string;
  pdfHash: string;
  snapshotHash: string;
  status: string;
  metadataOnly: boolean;
  templateVersion: string;
  renderVersion: string;
};

type EmailOutboxResult = {
  event: {
    invoiceNumber: string;
  };
  emailJob: {
    id: string;
    status: string;
    templateCode: string;
    to: string[];
    attachmentFileIds: string[];
  };
  emailLog: {
    status: string;
  };
};

type EmailOutboxJobResult = {
  id: string;
  status: string;
  templateCode: string;
  to: string[];
  attachmentFileIds: string[];
  latestLog: {
    status: string;
  } | null;
};

type CreateDraftInvoicePanelProps = {
  organizationId: string;
  customerId: string;
};

const formatter = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR"
});

function pdfDownloadHref(invoiceId: string, fileId: string, organizationId: string) {
  return `/api/invoices/${invoiceId}/pdf-render/${fileId}?organizationId=${encodeURIComponent(
    organizationId
  )}`;
}

export function CreateDraftInvoicePanel({
  organizationId,
  customerId
}: CreateDraftInvoicePanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [issuingInvoiceId, setIssuingInvoiceId] = useState<string | null>(null);
  const [isPreparingPdfMetadata, setIsPreparingPdfMetadata] = useState(false);
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [isPreparingEmailOutbox, setIsPreparingEmailOutbox] = useState(false);
  const [isLoadingPdfMetadataList, setIsLoadingPdfMetadataList] = useState(false);
  const [isLoadingEmailOutboxList, setIsLoadingEmailOutboxList] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [result, setResult] = useState<DraftInvoiceResult | null>(null);
  const [pdfMetadata, setPdfMetadata] = useState<PdfMetadataResult | null>(null);
  const [pdfRender, setPdfRender] = useState<(PdfMetadataResult & { byteLength: number }) | null>(
    null
  );
  const [emailOutbox, setEmailOutbox] = useState<EmailOutboxResult | null>(null);
  const [pdfMetadataVersions, setPdfMetadataVersions] = useState<PdfMetadataResult[]>([]);
  const [emailOutboxJobs, setEmailOutboxJobs] = useState<EmailOutboxJobResult[]>([]);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DraftInvoiceResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadDrafts() {
    setIsLoadingList(true);

    try {
      const response = await fetch(
        `/api/invoices/drafts?organizationId=${encodeURIComponent(organizationId)}`
      );
      const payload = (await response.json()) as {
        invoices?: DraftInvoiceResult[];
        error?: string;
      };

      if (!response.ok || !payload.invoices) {
        throw new Error(payload.error ?? "Draft faktury sa nepodarilo nacitat.");
      }

      setDrafts(payload.invoices);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsLoadingList(false);
    }
  }

  async function loadPdfMetadataVersions(invoiceId: string) {
    setIsLoadingPdfMetadataList(true);

    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/pdf-metadata?organizationId=${encodeURIComponent(
          organizationId
        )}`
      );
      const payload = (await response.json()) as {
        pdfMetadata?: PdfMetadataResult[];
        error?: string;
      };

      if (!response.ok || !payload.pdfMetadata) {
        throw new Error(payload.error ?? "PDF metadata verzie sa nepodarilo nacitat.");
      }

      setPdfMetadataVersions(payload.pdfMetadata);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsLoadingPdfMetadataList(false);
    }
  }

  async function loadEmailOutboxJobs(invoiceId: string) {
    setIsLoadingEmailOutboxList(true);

    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/email-outbox?organizationId=${encodeURIComponent(
          organizationId
        )}`
      );
      const payload = (await response.json()) as {
        emailJobs?: EmailOutboxJobResult[];
        error?: string;
      };

      if (!response.ok || !payload.emailJobs) {
        throw new Error(payload.error ?? "Email outbox joby sa nepodarilo nacitat.");
      }

      setEmailOutboxJobs(payload.emailJobs);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsLoadingEmailOutboxList(false);
    }
  }

  useEffect(() => {
    void loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  async function handleCreateDraft() {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/invoices/drafts", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId,
          customerId,
          issueDate: "2026-04-01",
          deliveryDate: "2026-04-01",
          dueDate: "2026-04-15",
          vatMode: "payer",
          items: [
            {
              description: "UI overenie draft faktury",
              quantity: 1,
              unit: "ks",
              unitPriceNet: 150,
              vatRateCode: "SK-23",
              vatTreatmentCode: "domestic_goods_or_services"
            }
          ]
        })
      });

      const payload = (await response.json()) as {
        invoice?: DraftInvoiceResult;
        error?: string;
      };

      if (!response.ok || !payload.invoice) {
        throw new Error(payload.error ?? "Draft fakturu sa nepodarilo vytvorit.");
      }

      setResult(payload.invoice);
      setPdfMetadata(null);
      setPdfRender(null);
      setEmailOutbox(null);
      setPdfMetadataVersions([]);
      setEmailOutboxJobs([]);
      setHtmlPreview(null);
      await loadDrafts();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleIssueDraft(invoiceId: string) {
    setIssuingInvoiceId(invoiceId);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/issue`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId
        })
      });

      const payload = (await response.json()) as {
        invoice?: DraftInvoiceResult;
        error?: string;
      };

      if (!response.ok || !payload.invoice) {
        throw new Error(payload.error ?? "Fakturu sa nepodarilo vystavit.");
      }

      setResult(payload.invoice);
      setPdfMetadata(null);
      setPdfRender(null);
      setEmailOutbox(null);
      setPdfMetadataVersions([]);
      setEmailOutboxJobs([]);
      setHtmlPreview(null);
      await loadPdfMetadataVersions(payload.invoice.id);
      await loadEmailOutboxJobs(payload.invoice.id);
      await loadDrafts();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIssuingInvoiceId(null);
    }
  }

  async function handlePreparePdfMetadata() {
    if (!result) {
      return;
    }

    setIsPreparingPdfMetadata(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${result.id}/pdf-metadata`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId
        })
      });

      const payload = (await response.json()) as {
        pdfMetadata?: PdfMetadataResult;
        htmlPreview?: string | null;
        error?: string;
      };

      if (!response.ok || !payload.pdfMetadata) {
        throw new Error(payload.error ?? "PDF metadata sa nepodarilo pripravit.");
      }

      setPdfMetadata(payload.pdfMetadata);
      setHtmlPreview(payload.htmlPreview ?? null);
      await loadPdfMetadataVersions(result.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsPreparingPdfMetadata(false);
    }
  }

  async function handleRenderPdf() {
    if (!result) {
      return;
    }

    setIsRenderingPdf(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${result.id}/pdf-render`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId
        })
      });

      const payload = (await response.json()) as {
        pdfVersion?: PdfMetadataResult;
        byteLength?: number;
        error?: string;
      };

      if (!response.ok || !payload.pdfVersion || typeof payload.byteLength !== "number") {
        throw new Error(payload.error ?? "PDF sa nepodarilo renderovat.");
      }

      setPdfRender({
        ...payload.pdfVersion,
        byteLength: payload.byteLength
      });
      setEmailOutbox(null);
      await loadPdfMetadataVersions(result.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsRenderingPdf(false);
    }
  }

  async function handlePrepareEmailOutbox() {
    if (!result || !pdfRender) {
      return;
    }

    setIsPreparingEmailOutbox(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${result.id}/email-outbox`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId,
          pdfVersionId: pdfRender.id,
          to: ["odberatel@example.com"]
        })
      });

      const payload = (await response.json()) as EmailOutboxResult & {
        error?: string;
      };

      if (!response.ok || !payload.emailJob || !payload.emailLog) {
        throw new Error(payload.error ?? "Email outbox sa nepodarilo pripravit.");
      }

      setEmailOutbox(payload);
      await loadEmailOutboxJobs(result.id);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsPreparingEmailOutbox(false);
    }
  }

  return (
    <section className="actionPanel" aria-label="Vytvorenie draft faktury cez API">
      <div>
        <span className="label">Runtime akcia</span>
        <h2>Vytvorit draft fakturu cez API</h2>
        <p>
          Tato akcia zavola runtime endpoint a vytvori novu draft fakturu bez cisla.
        </p>
      </div>

      <button type="button" onClick={handleCreateDraft} disabled={isCreating}>
        {isCreating ? "Vytvaram..." : "Vytvorit draft"}
      </button>

      {result ? (
        <dl className="resultList" aria-label="Vysledok vytvorenia draft faktury">
          <div>
            <dt>Status</dt>
            <dd>{result.status}</dd>
          </div>
          <div>
            <dt>Cislo</dt>
            <dd>{result.number ?? "zatial nepridelene"}</dd>
          </div>
          {result.variableSymbol ? (
            <div>
              <dt>VS</dt>
              <dd>{result.variableSymbol}</dd>
            </div>
          ) : null}
          <div>
            <dt>Suma</dt>
            <dd>{formatter.format(result.grossTotal)}</dd>
          </div>
          <div>
            <dt>Polozky</dt>
            <dd>{result.itemCount}</dd>
          </div>
          {result.snapshotCreated ? (
            <div>
              <dt>Snapshot</dt>
              <dd>vytvoreny</dd>
            </div>
          ) : null}
          {result.status === "issued" && result.snapshotCreated ? (
            <div>
              <dt>PDF metadata</dt>
              <dd>
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => void handlePreparePdfMetadata()}
                  disabled={isPreparingPdfMetadata}
                >
                  {isPreparingPdfMetadata ? "Pripravujem..." : "Pripravit PDF metadata"}
                </button>
              </dd>
            </div>
          ) : null}
          {result.status === "issued" && result.snapshotCreated ? (
            <div>
              <dt>PDF render</dt>
              <dd>
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => void handleRenderPdf()}
                  disabled={isRenderingPdf}
                >
                  {isRenderingPdf ? "Renderujem..." : "Renderovat PDF"}
                </button>
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {pdfMetadata ? (
        <dl className="resultList" aria-label="Vysledok pripravy PDF metadata">
          <div>
            <dt>PDF verzia</dt>
            <dd>{pdfMetadata.version}</dd>
          </div>
          <div>
            <dt>Stav</dt>
            <dd>{pdfMetadata.status}</dd>
          </div>
          <div>
            <dt>Metadata-only</dt>
            <dd>{pdfMetadata.metadataOnly ? "ano" : "nie"}</dd>
          </div>
          <div>
            <dt>Snapshot hash</dt>
            <dd>{pdfMetadata.snapshotHash.slice(0, 12)}...</dd>
          </div>
          <div>
            <dt>PDF hash</dt>
            <dd>{pdfMetadata.pdfHash.slice(0, 12)}...</dd>
          </div>
        </dl>
      ) : null}

      {pdfRender ? (
        <dl className="resultList" aria-label="Vysledok PDF renderu">
          <div>
            <dt>PDF verzia</dt>
            <dd>{pdfRender.version}</dd>
          </div>
          <div>
            <dt>Stav</dt>
            <dd>{pdfRender.status}</dd>
          </div>
          <div>
            <dt>Metadata-only</dt>
            <dd>{pdfRender.metadataOnly ? "ano" : "nie"}</dd>
          </div>
          <div>
            <dt>Velkost</dt>
            <dd>{pdfRender.byteLength} B</dd>
          </div>
          <div>
            <dt>PDF hash</dt>
            <dd>{pdfRender.pdfHash.slice(0, 12)}...</dd>
          </div>
          {pdfRender.invoiceId && pdfRender.fileId ? (
            <div>
              <dt>Subor</dt>
              <dd>
                <a
                  className="downloadLink"
                  href={pdfDownloadHref(pdfRender.invoiceId, pdfRender.fileId, organizationId)}
                >
                  Stiahnut PDF
                </a>
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Email outbox</dt>
            <dd>
              <button
                type="button"
                className="secondaryButton"
                onClick={() => void handlePrepareEmailOutbox()}
                disabled={isPreparingEmailOutbox}
              >
                {isPreparingEmailOutbox ? "Pripravujem..." : "Pripravit email outbox"}
              </button>
            </dd>
          </div>
        </dl>
      ) : null}

      {emailOutbox ? (
        <dl className="resultList" aria-label="Vysledok pripravy email outboxu">
          <div>
            <dt>Email job</dt>
            <dd>{emailOutbox.emailJob.status}</dd>
          </div>
          <div>
            <dt>Email log</dt>
            <dd>{emailOutbox.emailLog.status}</dd>
          </div>
          <div>
            <dt>Sablona</dt>
            <dd>{emailOutbox.emailJob.templateCode}</dd>
          </div>
          <div>
            <dt>Prijemca</dt>
            <dd>{emailOutbox.emailJob.to[0]}</dd>
          </div>
          <div>
            <dt>Priloha</dt>
            <dd>{emailOutbox.emailJob.attachmentFileIds.length} PDF</dd>
          </div>
        </dl>
      ) : null}

      {htmlPreview ? (
        <div className="invoicePreview" aria-label="HTML nahlad faktury">
          <div className="draftListHeader">
            <span className="label">HTML preview</span>
            <strong>snapshot render</strong>
          </div>
          <iframe title="HTML nahlad faktury" srcDoc={htmlPreview} />
        </div>
      ) : null}

      {result?.status === "issued" ? (
        <div className="emailOutboxList" aria-label="Email outbox joby faktury">
          <div className="draftListHeader">
            <span className="label">Email outbox</span>
            <strong>
              {isLoadingEmailOutboxList
                ? "Nacitavam..."
                : `${emailOutboxJobs.length} email jobov`}
            </strong>
          </div>

          {emailOutboxJobs.length > 0 ? (
            <ul>
              {emailOutboxJobs.map((job) => (
                <li key={job.id}>
                  <span>{job.status}</span>
                  <span>{job.latestLog?.status ?? "bez logu"}</span>
                  <span>{job.templateCode}</span>
                  <span>{job.to[0] ?? "bez prijemcu"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Zatial nie su pripravene ziadne email outbox joby.</p>
          )}
        </div>
      ) : null}

      {result?.status === "issued" ? (
        <div className="pdfVersionList" aria-label="Ulozene PDF metadata verzie">
          <div className="draftListHeader">
            <span className="label">PDF metadata verzie</span>
            <strong>
              {isLoadingPdfMetadataList
                ? "Nacitavam..."
                : `${pdfMetadataVersions.length} metadata verzii`}
            </strong>
          </div>

          {pdfMetadataVersions.length > 0 ? (
            <ul>
              {pdfMetadataVersions.map((metadata) => (
                <li key={metadata.id}>
                  <span>v{metadata.version}</span>
                  <span>{metadata.status}</span>
                  <span>{metadata.metadataOnly ? "metadata-only" : "render"}</span>
                  {metadata.invoiceId && metadata.fileId && !metadata.metadataOnly ? (
                    <a
                      className="downloadLink"
                      href={pdfDownloadHref(metadata.invoiceId, metadata.fileId, organizationId)}
                    >
                      Stiahnut PDF
                    </a>
                  ) : (
                    <span>{metadata.pdfHash.slice(0, 12)}...</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p>Zatial nie su ulozene ziadne PDF metadata verzie.</p>
          )}
        </div>
      ) : null}

      {error ? (
        <p className="errorText" role="alert">
          {error}
        </p>
      ) : null}

      <div className="draftList" aria-label="Ulozene runtime draft faktury">
        <div className="draftListHeader">
          <span className="label">Databaza</span>
          <strong>{isLoadingList ? "Nacitavam..." : `${drafts.length} draft faktur`}</strong>
        </div>

        {drafts.length > 0 ? (
          <ul>
            {drafts.map((draft) => (
              <li key={draft.id}>
                <span>{formatter.format(draft.grossTotal)}</span>
                <span>{draft.number ?? "cislo nepridelene"}</span>
                <span>{draft.status}</span>
                <button
                  type="button"
                  className="secondaryButton"
                  onClick={() => void handleIssueDraft(draft.id)}
                  disabled={issuingInvoiceId === draft.id}
                >
                  {issuingInvoiceId === draft.id ? "Vystavujem..." : "Vystavit"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Zatial nie su nacitane ziadne runtime draft faktury.</p>
        )}
      </div>
    </section>
  );
}
