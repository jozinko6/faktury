"use client";

import { useEffect, useState } from "react";

type BankTransactionResult = {
  id: string;
  bookingDate: string;
  amount: number;
  currency: string;
  counterpartyName: string | null;
  variableSymbol: string | null;
  bankReference: string | null;
  status: string;
};

type BankImportResult = {
  id: string;
  bankAccountId: string;
  bankAccount: {
    iban: string | null;
    bankName: string | null;
    currency: string;
  };
  parserType: string;
  sourceFileName: string;
  status: string;
  newTransactionsCount: number;
  duplicateTransactionsCount: number;
  transactions: BankTransactionResult[];
};

type BankImportPanelProps = {
  organizationId: string;
  bankAccountId: string;
};

const bankFormatter = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR"
});

const sampleCsv = [
  "bookingDate;valueDate;amount;currency;counterpartyName;counterpartyIban;counterpartyBic;variableSymbol;constantSymbol;specificSymbol;message;bankReference",
  "2026-08-01;2026-08-01;199.90;EUR;UI Odberatel s.r.o.;SK8975000000000012345671;CEKOSKBX;20260005;;;Uhrada faktury FV20260005;BANK-UI-0001",
  "2026-08-02;2026-08-02;-7.20;EUR;Banka;;;;;;Poplatok za ucet;BANK-UI-0002"
].join("\n");

export function BankImportPanel({ organizationId, bankAccountId }: BankImportPanelProps) {
  const [imports, setImports] = useState<BankImportResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadImports() {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/banking/imports?organizationId=${encodeURIComponent(
          organizationId
        )}&bankAccountId=${encodeURIComponent(bankAccountId)}`
      );
      const payload = (await response.json()) as {
        imports?: BankImportResult[];
        error?: string;
      };

      if (!response.ok || !payload.imports) {
        throw new Error(payload.error ?? "Bankove importy sa nepodarilo nacitat.");
      }

      setImports(payload.imports);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadImports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, bankAccountId]);

  async function handleImportSampleCsv() {
    setIsImporting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/banking/imports/csv", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          organizationId,
          bankAccountId,
          sourceFileName: "ui-bank-statement-2026-08.csv",
          csvContent: sampleCsv,
          importedBy: "00000000-0000-4000-8000-000000000001"
        })
      });
      const payload = (await response.json()) as {
        newTransactionsCount?: number;
        duplicateTransactionsCount?: number;
        duplicateImport?: boolean;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Bankovy CSV import zlyhal.");
      }

      setMessage(
        payload.duplicateImport
          ? `Duplicitny import: ${payload.duplicateTransactionsCount ?? 0} transakcii uz existuje.`
          : `Importovane transakcie: ${payload.newTransactionsCount ?? 0}.`
      );
      await loadImports();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Neznama chyba.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <section className="actionPanel bankPanel" aria-label="Bankove transakcie">
      <div>
        <span className="label">Banka</span>
        <h2>Import bankoveho CSV</h2>
        <p>
          MVP panel vola generic CSV import a nacita ulozene bankove transakcie bez parovania.
        </p>
      </div>

      <button type="button" onClick={handleImportSampleCsv} disabled={isImporting}>
        {isImporting ? "Importujem..." : "Importovat bankovy CSV"}
      </button>

      {message ? <p className="successText">{message}</p> : null}
      {error ? (
        <p className="errorText" role="alert">
          {error}
        </p>
      ) : null}

      <div className="bankImportList" aria-label="Ulozene bankove importy">
        <div className="draftListHeader">
          <span className="label">Importy</span>
          <strong>{isLoading ? "Nacitavam..." : `${imports.length} importov`}</strong>
        </div>

        {imports.length > 0 ? (
          <ul>
            {imports.map((bankImport) => (
              <li key={bankImport.id}>
                <div>
                  <strong>{bankImport.sourceFileName}</strong>
                  <span>{bankImport.bankAccount.iban ?? bankImport.bankAccount.bankName}</span>
                </div>
                <span>{bankImport.status}</span>
                <span>{bankImport.parserType}</span>
                <span>{bankImport.newTransactionsCount} novych</span>
                {bankImport.transactions.length > 0 ? (
                  <ul className="bankTransactionList">
                    {bankImport.transactions.map((transaction) => (
                      <li key={transaction.id}>
                        <span>{transaction.bookingDate}</span>
                        <span>{bankFormatter.format(transaction.amount)}</span>
                        <span>{transaction.variableSymbol ?? transaction.bankReference ?? "bez referencie"}</span>
                        <span>{transaction.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>Zatial nie su nacitane ziadne bankove importy.</p>
        )}
      </div>
    </section>
  );
}
