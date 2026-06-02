import { prisma } from "../lib/prisma";
import { importGenericBankCsv } from "../lib/banking/import-generic-bank-csv";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";

const bankAccountId = "95959595-9595-4959-8959-959595959595";
const statementImportId = "96969696-9696-4969-8969-969696969696";
const importedBy = "97979797-9797-4979-8979-979797979797";

const csvContent = [
  "bookingDate;valueDate;amount;currency;counterpartyName;counterpartyIban;counterpartyBic;variableSymbol;constantSymbol;specificSymbol;message;bankReference",
  "2026-07-01;2026-07-01;250.75;EUR;Odberatel s.r.o.;SK8975000000000012345671;CEKOSKBX;20260002;;;Uhrada faktury FV20260002;BANK-CSV-0001",
  "2026-07-02;2026-07-02;-12.50;EUR;Banka;;;;;;Poplatok za ucet;BANK-CSV-0002"
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
      iban: "SK4012000000198742637542",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: false,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-07-01T08:00:00Z"),
      updatedAt: new Date("2026-07-01T08:00:00Z")
    }
  });

  const imported = await importGenericBankCsv({
    organizationId,
    bankAccountId,
    sourceFileName: "bank-statement-2026-07.csv",
    csvContent,
    importedBy,
    importedAt: new Date("2026-07-03T08:00:00Z"),
    statementImportId
  });

  if (imported.duplicateImport) {
    throw new Error("First CSV import must not be marked as duplicate.");
  }

  if (imported.newTransactionsCount !== 2) {
    throw new Error(`Expected 2 new bank transactions, got ${imported.newTransactionsCount}.`);
  }

  const repeated = await importGenericBankCsv({
    organizationId,
    bankAccountId,
    sourceFileName: "bank-statement-2026-07.csv",
    csvContent,
    importedBy,
    importedAt: new Date("2026-07-03T08:05:00Z")
  });

  if (!repeated.duplicateImport) {
    throw new Error("Repeated CSV import must be detected by importHash.");
  }

  if (repeated.newTransactionsCount !== 0 || repeated.duplicateTransactionsCount !== 2) {
    throw new Error("Repeated CSV import must return only duplicate transactions.");
  }

  const transactionsInDatabase = await prisma.bankTransaction.count({
    where: {
      bankAccountId
    }
  });

  if (transactionsInDatabase !== 2) {
    throw new Error(`Expected exactly 2 persisted bank transactions, got ${transactionsInDatabase}.`);
  }

  console.log(
    JSON.stringify(
      {
        statementImportId: imported.statementImport.id,
        parserType: imported.statementImport.parserType,
        importStatus: imported.statementImport.status,
        newTransactionsCount: imported.newTransactionsCount,
        duplicateTransactionsCount: repeated.duplicateTransactionsCount,
        duplicateImport: repeated.duplicateImport,
        transactionsInDatabase
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
