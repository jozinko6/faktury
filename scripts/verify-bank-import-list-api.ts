import { prisma } from "../lib/prisma";
import { importGenericBankCsv } from "../lib/banking/import-generic-bank-csv";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";

const bankAccountId = "9a9a9a9a-9a9a-4a9a-8a9a-9a9a9a9a9a9a";
const importedBy = "9b9b9b9b-9b9b-4b9b-8b9b-9b9b9b9b9b9b";

const csvContent = [
  "bookingDate;valueDate;amount;currency;counterpartyName;counterpartyIban;counterpartyBic;variableSymbol;constantSymbol;specificSymbol;message;bankReference",
  "2026-07-20;2026-07-20;88.80;EUR;List API Odberatel s.r.o.;SK8975000000000012345671;CEKOSKBX;20260004;;;Uhrada faktury FV20260004;BANK-LIST-0001"
].join("\n");

async function main() {
  const organizationId = organizationFixture.organization.id;

  await prisma.bankTransaction.deleteMany({
    where: {
      bankAccountId
    }
  });
  await prisma.bankStatementImport.deleteMany({
    where: {
      bankAccountId
    }
  });
  await prisma.bankAccount.deleteMany({
    where: {
      id: bankAccountId
    }
  });

  await prisma.bankAccount.create({
    data: {
      id: bankAccountId,
      organizationId,
      iban: "SK7412000000198742637544",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: false,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-07-20T08:00:00Z"),
      updatedAt: new Date("2026-07-20T08:00:00Z")
    }
  });

  const created = await importGenericBankCsv({
    organizationId,
    bankAccountId,
    sourceFileName: "bank-statement-list-2026-07.csv",
    csvContent,
    importedBy,
    importedAt: new Date("2026-07-20T08:05:00Z")
  });

  const response = await fetch(
    `http://127.0.0.1:3100/api/banking/imports?organizationId=${organizationId}&bankAccountId=${bankAccountId}`
  );
  const payload = (await response.json()) as {
    imports?: Array<{
      id: string;
      bankAccountId: string;
      parserType: string;
      sourceFileName: string;
      newTransactionsCount: number;
      duplicateTransactionsCount: number;
      transactions: Array<{
        id: string;
        amount: number;
        status: string;
        transactionHash: string;
      }>;
    }>;
    error?: string;
  };

  if (response.status !== 200 || !payload.imports) {
    throw new Error(`Expected bank import list response, got ${response.status}: ${payload.error}`);
  }

  const loaded = payload.imports.find((statementImport) => statementImport.id === created.statementImport.id);

  if (!loaded) {
    throw new Error("Created bank statement import was not returned by list API.");
  }

  if (loaded.bankAccountId !== bankAccountId || loaded.parserType !== "csv_generic") {
    throw new Error("List API must return bank account and parser metadata.");
  }

  if (loaded.transactions.length !== 1 || loaded.transactions[0].status !== "new") {
    throw new Error("List API must return the imported bank transaction.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: response.status,
        statementImportId: loaded.id,
        bankAccountId: loaded.bankAccountId,
        parserType: loaded.parserType,
        newTransactionsCount: loaded.newTransactionsCount,
        transactionCount: loaded.transactions.length,
        transactionStatus: loaded.transactions[0].status
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
