import { prisma } from "../lib/prisma";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";

const bankAccountId = "98989898-9898-4989-8989-989898989898";
const importedBy = "99999999-9999-4999-8999-999999999998";

const csvContent = [
  "bookingDate;valueDate;amount;currency;counterpartyName;counterpartyIban;counterpartyBic;variableSymbol;constantSymbol;specificSymbol;message;bankReference",
  "2026-07-10;2026-07-10;410.00;EUR;API Odberatel s.r.o.;SK8975000000000012345671;CEKOSKBX;20260003;;;Uhrada faktury FV20260003;BANK-API-0001"
].join("\n");

async function callImportApi() {
  const response = await fetch("http://127.0.0.1:3100/api/banking/imports/csv", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      organizationId: organizationFixture.organization.id,
      bankAccountId,
      sourceFileName: "bank-statement-api-2026-07.csv",
      csvContent,
      importedBy
    })
  });

  const payload = (await response.json()) as {
    statementImport?: {
      id: string;
      parserType: string;
      importHash: string;
      newTransactionsCount: number;
      duplicateTransactionsCount: number;
    };
    transactions?: Array<{
      id: string;
      amount: number;
      status: string;
      transactionHash: string;
    }>;
    newTransactionsCount?: number;
    duplicateTransactionsCount?: number;
    duplicateImport?: boolean;
    error?: string;
  };

  return { response, payload };
}

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
      iban: "SK5712000000198742637543",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: false,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-07-10T08:00:00Z"),
      updatedAt: new Date("2026-07-10T08:00:00Z")
    }
  });

  const first = await callImportApi();

  if (first.response.status !== 201 || !first.payload.statementImport || !first.payload.transactions) {
    throw new Error(`Expected first API import to return 201, got ${first.response.status}: ${first.payload.error}`);
  }

  if (first.payload.newTransactionsCount !== 1 || first.payload.transactions.length !== 1) {
    throw new Error("First API import must return one created transaction.");
  }

  if (first.payload.transactions[0].amount !== 410 || first.payload.transactions[0].status !== "new") {
    throw new Error("API import must serialize the created bank transaction.");
  }

  const second = await callImportApi();

  if (second.response.status !== 200 || !second.payload.duplicateImport) {
    throw new Error(`Expected repeated API import to return duplicate 200, got ${second.response.status}.`);
  }

  if (second.payload.newTransactionsCount !== 0 || second.payload.duplicateTransactionsCount !== 1) {
    throw new Error("Repeated API import must return duplicate counts.");
  }

  console.log(
    JSON.stringify(
      {
        firstHttpStatus: first.response.status,
        repeatedHttpStatus: second.response.status,
        statementImportId: first.payload.statementImport.id,
        parserType: first.payload.statementImport.parserType,
        newTransactionsCount: first.payload.newTransactionsCount,
        duplicateTransactionsCount: second.payload.duplicateTransactionsCount,
        duplicateImport: second.payload.duplicateImport,
        transactionStatus: first.payload.transactions[0].status
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
