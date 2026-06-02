import { createHash, randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export type ImportGenericBankCsvInput = {
  organizationId: string;
  bankAccountId: string;
  sourceFileName: string;
  csvContent: string;
  importedBy: string;
  importedAt?: Date;
  statementImportId?: string;
};

type ParsedBankCsvRow = {
  bookingDate: string;
  valueDate: string | null;
  amount: string;
  currency: string;
  counterpartyName: string | null;
  counterpartyIban: string | null;
  counterpartyBic: string | null;
  variableSymbol: string | null;
  constantSymbol: string | null;
  specificSymbol: string | null;
  message: string | null;
  bankReference: string | null;
};

const requiredColumns = ["bookingDate", "amount", "currency"];

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseGenericCsv(csvContent: string) {
  const lines = csvContent
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("Bank CSV import requires a header and at least one transaction row.");
  }

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter);
  const missingColumns = requiredColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    throw new Error(`Bank CSV import is missing required columns: ${missingColumns.join(", ")}.`);
  }

  return lines.slice(1).map((line, rowIndex): ParsedBankCsvRow => {
    const values = splitCsvLine(line, delimiter);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    const bookingDate = row.bookingDate;
    const amount = row.amount.replace(",", ".");
    const currency = row.currency || "EUR";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      throw new Error(`Invalid bookingDate on bank CSV row ${rowIndex + 2}: ${bookingDate}.`);
    }

    if (!/^-?\d+(\.\d+)?$/.test(amount)) {
      throw new Error(`Invalid amount on bank CSV row ${rowIndex + 2}: ${row.amount}.`);
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error(`Invalid currency on bank CSV row ${rowIndex + 2}: ${currency}.`);
    }

    return {
      bookingDate,
      valueDate: row.valueDate || null,
      amount,
      currency,
      counterpartyName: row.counterpartyName || null,
      counterpartyIban: row.counterpartyIban || null,
      counterpartyBic: row.counterpartyBic || null,
      variableSymbol: row.variableSymbol || null,
      constantSymbol: row.constantSymbol || null,
      specificSymbol: row.specificSymbol || null,
      message: row.message || null,
      bankReference: row.bankReference || null
    };
  });
}

function transactionHash(bankAccountId: string, row: ParsedBankCsvRow) {
  return sha256(
    JSON.stringify({
      bankAccountId,
      bookingDate: row.bookingDate,
      valueDate: row.valueDate,
      amount: row.amount,
      currency: row.currency,
      counterpartyIban: row.counterpartyIban,
      variableSymbol: row.variableSymbol,
      bankReference: row.bankReference,
      message: row.message
    })
  );
}

export async function importGenericBankCsv(
  input: ImportGenericBankCsvInput,
  client: PrismaClient = defaultPrisma
) {
  const importedAt = input.importedAt ?? new Date();
  const normalizedContent = input.csvContent.trim();
  const fileHash = sha256(normalizedContent);
  const importHash = sha256(
    JSON.stringify({
      organizationId: input.organizationId,
      bankAccountId: input.bankAccountId,
      parserType: "csv_generic",
      sourceFileName: input.sourceFileName,
      fileHash
    })
  );
  const rows = parseGenericCsv(normalizedContent);

  return client.$transaction(async (transaction) => {
    const bankAccount = await transaction.bankAccount.findFirst({
      where: {
        id: input.bankAccountId,
        organizationId: input.organizationId
      }
    });

    if (!bankAccount) {
      throw new Error("Bank account was not found for the selected organization.");
    }

    const existingImport = await transaction.bankStatementImport.findFirst({
      where: {
        organizationId: input.organizationId,
        importHash
      },
      include: {
        transactions: true
      }
    });

    if (existingImport) {
      return {
        statementImport: existingImport,
        transactions: existingImport.transactions,
        newTransactionsCount: 0,
        duplicateTransactionsCount: existingImport.transactions.length,
        duplicateImport: true
      };
    }

    const statementImport = await transaction.bankStatementImport.create({
      data: {
        id: input.statementImportId ?? randomUUID(),
        organizationId: input.organizationId,
        bankAccountId: input.bankAccountId,
        parserType: "csv_generic",
        sourceFileName: input.sourceFileName,
        fileHash,
        importHash,
        status: "imported",
        newTransactionsCount: 0,
        duplicateTransactionsCount: 0,
        errorMessage: null,
        importedBy: input.importedBy,
        importedAt
      }
    });

    const createdTransactions = [];
    let duplicateTransactionsCount = 0;

    for (const row of rows) {
      const hash = transactionHash(input.bankAccountId, row);
      const existingTransaction = await transaction.bankTransaction.findFirst({
        where: {
          organizationId: input.organizationId,
          transactionHash: hash
        }
      });

      if (existingTransaction) {
        duplicateTransactionsCount += 1;
        continue;
      }

      const createdTransaction = await transaction.bankTransaction.create({
        data: {
          id: randomUUID(),
          organizationId: input.organizationId,
          bankAccountId: input.bankAccountId,
          statementImportId: statementImport.id,
          bookingDate: new Date(row.bookingDate),
          valueDate: row.valueDate ? new Date(row.valueDate) : null,
          amount: row.amount,
          currency: row.currency,
          counterpartyName: row.counterpartyName,
          counterpartyIban: row.counterpartyIban,
          counterpartyBic: row.counterpartyBic,
          variableSymbol: row.variableSymbol,
          constantSymbol: row.constantSymbol,
          specificSymbol: row.specificSymbol,
          message: row.message,
          bankReference: row.bankReference,
          transactionHash: hash,
          status: "new",
          createdAt: importedAt,
          updatedAt: null
        }
      });

      createdTransactions.push(createdTransaction);
    }

    const updatedImport = await transaction.bankStatementImport.update({
      where: {
        id: statementImport.id
      },
      data: {
        newTransactionsCount: createdTransactions.length,
        duplicateTransactionsCount
      }
    });

    return {
      statementImport: updatedImport,
      transactions: createdTransactions,
      newTransactionsCount: createdTransactions.length,
      duplicateTransactionsCount,
      duplicateImport: false
    };
  });
}
