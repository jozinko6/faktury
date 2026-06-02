import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

function serializeTransaction(transaction: {
  id: string;
  bookingDate: Date;
  valueDate: Date | null;
  amount: { toNumber(): number };
  currency: string;
  counterpartyName: string | null;
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
    counterpartyName: transaction.counterpartyName,
    variableSymbol: transaction.variableSymbol,
    bankReference: transaction.bankReference,
    transactionHash: transaction.transactionHash,
    status: transaction.status
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get("organizationId");
  const bankAccountId = searchParams.get("bankAccountId");

  if (!organizationId) {
    return NextResponse.json(
      {
        error: "Query parameter organizationId is required."
      },
      { status: 400 }
    );
  }

  const imports = await prisma.bankStatementImport.findMany({
    where: {
      organizationId,
      ...(bankAccountId ? { bankAccountId } : {})
    },
    include: {
      bankAccount: true,
      transactions: {
        orderBy: {
          bookingDate: "desc"
        },
        take: 50
      }
    },
    orderBy: {
      importedAt: "desc"
    },
    take: 20
  });

  return NextResponse.json({
    imports: imports.map((statementImport) => ({
      id: statementImport.id,
      bankAccountId: statementImport.bankAccountId,
      bankAccount: {
        id: statementImport.bankAccount.id,
        iban: statementImport.bankAccount.iban,
        bankName: statementImport.bankAccount.bankName,
        currency: statementImport.bankAccount.currency,
        accountType: statementImport.bankAccount.accountType
      },
      parserType: statementImport.parserType,
      sourceFileName: statementImport.sourceFileName,
      fileHash: statementImport.fileHash,
      importHash: statementImport.importHash,
      status: statementImport.status,
      newTransactionsCount: statementImport.newTransactionsCount,
      duplicateTransactionsCount: statementImport.duplicateTransactionsCount,
      importedBy: statementImport.importedBy,
      importedAt: statementImport.importedAt.toISOString(),
      transactions: statementImport.transactions.map(serializeTransaction)
    }))
  });
}
