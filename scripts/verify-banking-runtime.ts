import { createHash } from "node:crypto";
import { prisma } from "../lib/prisma";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";

const bankAccountId = "91919191-9191-4919-8919-919191919191";
const statementImportId = "92929292-9292-4929-8929-929292929292";
const bankTransactionId = "93939393-9393-4939-8939-939393939393";
const importedBy = "94949494-9494-4949-8949-949494949494";

function sha256(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const organizationId = organizationFixture.organization.id;
  const fileHash = sha256({
    sourceFileName: "bank-statement-2026-06.csv",
    content: "2026-06-30;123.45;FV20260001"
  });
  const importHash = sha256({
    organizationId,
    bankAccountId,
    fileHash,
    parserType: "csv_generic"
  });
  const transactionHash = sha256({
    bankAccountId,
    bookingDate: "2026-06-30",
    amount: "123.45",
    variableSymbol: "20260001",
    bankReference: "BANK-REF-2026-0001"
  });

  await prisma.bankTransaction.deleteMany({
    where: { id: bankTransactionId }
  });
  await prisma.bankStatementImport.deleteMany({
    where: { id: statementImportId }
  });
  await prisma.bankAccount.deleteMany({
    where: { id: bankAccountId }
  });

  const bankAccount = await prisma.bankAccount.create({
    data: {
      id: bankAccountId,
      organizationId,
      iban: "SK3112000000198742637541",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: true,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-06-30T08:00:00Z"),
      updatedAt: new Date("2026-06-30T08:00:00Z")
    }
  });

  const statementImport = await prisma.bankStatementImport.create({
    data: {
      id: statementImportId,
      organizationId,
      bankAccountId: bankAccount.id,
      parserType: "csv_generic",
      sourceFileName: "bank-statement-2026-06.csv",
      fileHash,
      importHash,
      status: "imported",
      newTransactionsCount: 1,
      duplicateTransactionsCount: 0,
      errorMessage: null,
      importedBy,
      importedAt: new Date("2026-06-30T08:01:00Z")
    }
  });

  const transaction = await prisma.bankTransaction.create({
    data: {
      id: bankTransactionId,
      organizationId,
      bankAccountId: bankAccount.id,
      statementImportId: statementImport.id,
      bookingDate: new Date("2026-06-30"),
      valueDate: new Date("2026-06-30"),
      amount: 123.45,
      currency: "EUR",
      counterpartyName: "Odberatel s.r.o.",
      counterpartyIban: "SK8975000000000012345671",
      counterpartyBic: "CEKOSKBX",
      variableSymbol: "20260001",
      constantSymbol: null,
      specificSymbol: null,
      message: "Uhrada faktury FV20260001",
      bankReference: "BANK-REF-2026-0001",
      transactionHash,
      status: "new",
      createdAt: new Date("2026-06-30T08:02:00Z"),
      updatedAt: null
    }
  });

  const loadedImport = await prisma.bankStatementImport.findUnique({
    where: { id: statementImport.id },
    include: { transactions: true, bankAccount: true }
  });

  if (!loadedImport) {
    throw new Error("Expected bank statement import to be persisted.");
  }

  if (loadedImport.bankAccount.id !== bankAccount.id) {
    throw new Error("Statement import must stay linked to the bank account.");
  }

  if (loadedImport.transactions.length !== 1) {
    throw new Error(`Expected 1 imported transaction, got ${loadedImport.transactions.length}.`);
  }

  if (!/^[a-f0-9]{64}$/.test(transaction.transactionHash)) {
    throw new Error("Transaction hash must be a lowercase SHA-256 hash.");
  }

  console.log(
    JSON.stringify(
      {
        bankAccountId: bankAccount.id,
        statementImportId: statementImport.id,
        bankTransactionId: transaction.id,
        parserType: statementImport.parserType,
        importStatus: statementImport.status,
        transactionStatus: transaction.status,
        fileHash: statementImport.fileHash,
        importHash: statementImport.importHash,
        transactionHash: transaction.transactionHash
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
