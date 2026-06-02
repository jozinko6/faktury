import { NextResponse } from "next/server";
import { importGenericBankCsv } from "../../../../../lib/banking/import-generic-bank-csv";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(body: Record<string, unknown>, field: string) {
  const value = body[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Field ${field} is required.`);
  }
  return value;
}

function serializeTransaction(transaction: {
  id: string;
  bookingDate: Date;
  valueDate: Date | null;
  amount: { toNumber(): number };
  currency: string;
  variableSymbol: string | null;
  bankReference: string | null;
  transactionHash: string;
  status: string;
}) {
  return {
    id: transaction.id,
    bookingDate: transaction.bookingDate.toISOString().slice(0, 10),
    valueDate: transaction.valueDate?.toISOString().slice(0, 10) ?? null,
    amount: transaction.amount.toNumber(),
    currency: transaction.currency,
    variableSymbol: transaction.variableSymbol,
    bankReference: transaction.bankReference,
    transactionHash: transaction.transactionHash,
    status: transaction.status
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isRecord(body)) {
      throw new Error("Request body must be an object.");
    }

    const result = await importGenericBankCsv({
      organizationId: requireString(body, "organizationId"),
      bankAccountId: requireString(body, "bankAccountId"),
      sourceFileName: requireString(body, "sourceFileName"),
      csvContent: requireString(body, "csvContent"),
      importedBy: requireString(body, "importedBy")
    });

    return NextResponse.json(
      {
        statementImport: {
          id: result.statementImport.id,
          bankAccountId: result.statementImport.bankAccountId,
          parserType: result.statementImport.parserType,
          sourceFileName: result.statementImport.sourceFileName,
          fileHash: result.statementImport.fileHash,
          importHash: result.statementImport.importHash,
          status: result.statementImport.status,
          newTransactionsCount: result.statementImport.newTransactionsCount,
          duplicateTransactionsCount: result.statementImport.duplicateTransactionsCount,
          importedAt: result.statementImport.importedAt.toISOString()
        },
        transactions: result.transactions.map(serializeTransaction),
        newTransactionsCount: result.newTransactionsCount,
        duplicateTransactionsCount: result.duplicateTransactionsCount,
        duplicateImport: result.duplicateImport
      },
      { status: result.duplicateImport ? 200 : 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bank CSV import failed.";
    const status = message.includes("was not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: message
      },
      { status }
    );
  }
}
