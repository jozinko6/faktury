-- Initial local SQLite schema for the first MVP runtime slice.

CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "legalForm" TEXT NOT NULL,
    "ico" TEXT,
    "dic" TEXT,
    "icDph" TEXT,
    "country" TEXT NOT NULL DEFAULT 'SK',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "BusinessPartner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'SK',
    "defaultDueDays" INTEGER NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BusinessPartner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "number" TEXT,
    "variableSymbol" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "issueDate" DATETIME NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "vatMode" TEXT NOT NULL,
    "netTotal" DECIMAL NOT NULL,
    "vatTotal" DECIMAL NOT NULL,
    "grossTotal" DECIMAL NOT NULL,
    "allocatedPaymentsTotal" DECIMAL NOT NULL DEFAULT 0,
    "creditNotesTotal" DECIMAL NOT NULL DEFAULT 0,
    "remainingBalance" DECIMAL NOT NULL,
    "issueSnapshotJson" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "BusinessPartner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InvoiceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPriceNet" DECIMAL NOT NULL,
    "discountPercent" DECIMAL NOT NULL DEFAULT 0,
    "vatRateCode" TEXT NOT NULL,
    "vatTreatmentCode" TEXT NOT NULL,
    "lineNet" DECIMAL NOT NULL,
    "lineVat" DECIMAL NOT NULL,
    "lineGross" DECIMAL NOT NULL,
    CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "oldValueJson" TEXT,
    "newValueJson" TEXT,
    "reason" TEXT,
    "previousHash" TEXT,
    "currentHash" TEXT,
    CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "NumberSeries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "assignOn" TEXT NOT NULL DEFAULT 'issue',
    "padding" INTEGER NOT NULL DEFAULT 4,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NumberSeries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InvoicePdfVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fileId" TEXT NOT NULL,
    "pdfHash" TEXT NOT NULL,
    "snapshotHash" TEXT NOT NULL,
    "templateVersion" TEXT NOT NULL,
    "renderVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadataOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "InvoicePdfVersion_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "InvoiceEmailEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "pdfVersionId" TEXT NOT NULL,
    "occurredAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "InvoiceEmailEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InvoiceEmailEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EmailJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "pdfVersionId" TEXT,
    "templateCode" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'SK',
    "toJson" TEXT NOT NULL,
    "ccJson" TEXT,
    "bccJson" TEXT,
    "replyTo" TEXT,
    "subject" TEXT NOT NULL,
    "bodyHtmlSnapshot" TEXT,
    "bodyTextSnapshot" TEXT NOT NULL,
    "attachmentFileIdsJson" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextAttemptAt" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "processedAt" DATETIME,
    CONSTRAINT "EmailJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmailJob_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "InvoiceEmailEvent" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmailJob_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "emailJobId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" TEXT NOT NULL,
    "smtpResponse" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL,
    CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmailLog_emailJobId_fkey" FOREIGN KEY ("emailJobId") REFERENCES "EmailJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BankAccount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "iban" TEXT,
    "bic" TEXT,
    "bankName" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accountType" TEXT NOT NULL,
    "analyticsAccountCode" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BankAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BankStatementImport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "parserType" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "importHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "newTransactionsCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateTransactionsCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "importedBy" TEXT NOT NULL,
    "importedAt" DATETIME NOT NULL,
    CONSTRAINT "BankStatementImport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BankStatementImport_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "BankTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "statementImportId" TEXT NOT NULL,
    "bookingDate" DATETIME NOT NULL,
    "valueDate" DATETIME,
    "amount" DECIMAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "counterpartyName" TEXT,
    "counterpartyIban" TEXT,
    "counterpartyBic" TEXT,
    "variableSymbol" TEXT,
    "constantSymbol" TEXT,
    "specificSymbol" TEXT,
    "message" TEXT,
    "bankReference" TEXT,
    "transactionHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME,
    CONSTRAINT "BankTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BankTransaction_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BankTransaction_statementImportId_fkey" FOREIGN KEY ("statementImportId") REFERENCES "BankStatementImport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BusinessPartner_organizationId_idx" ON "BusinessPartner"("organizationId");
CREATE INDEX IF NOT EXISTS "Invoice_organizationId_idx" ON "Invoice"("organizationId");
CREATE INDEX IF NOT EXISTS "Invoice_customerId_idx" ON "Invoice"("customerId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "AuditEvent_organizationId_idx" ON "AuditEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "NumberSeries_organizationId_documentType_isActive_idx" ON "NumberSeries"("organizationId", "documentType", "isActive");
CREATE UNIQUE INDEX IF NOT EXISTS "InvoicePdfVersion_invoiceId_version_key" ON "InvoicePdfVersion"("invoiceId", "version");
CREATE INDEX IF NOT EXISTS "InvoicePdfVersion_organizationId_idx" ON "InvoicePdfVersion"("organizationId");
CREATE INDEX IF NOT EXISTS "InvoicePdfVersion_invoiceId_idx" ON "InvoicePdfVersion"("invoiceId");
CREATE INDEX IF NOT EXISTS "InvoiceEmailEvent_organizationId_idx" ON "InvoiceEmailEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "InvoiceEmailEvent_invoiceId_idx" ON "InvoiceEmailEvent"("invoiceId");
CREATE INDEX IF NOT EXISTS "EmailJob_organizationId_idx" ON "EmailJob"("organizationId");
CREATE INDEX IF NOT EXISTS "EmailJob_invoiceId_idx" ON "EmailJob"("invoiceId");
CREATE INDEX IF NOT EXISTS "EmailJob_status_nextAttemptAt_idx" ON "EmailJob"("status", "nextAttemptAt");
CREATE INDEX IF NOT EXISTS "EmailLog_organizationId_idx" ON "EmailLog"("organizationId");
CREATE INDEX IF NOT EXISTS "EmailLog_emailJobId_idx" ON "EmailLog"("emailJobId");
CREATE INDEX IF NOT EXISTS "BankAccount_organizationId_idx" ON "BankAccount"("organizationId");
CREATE UNIQUE INDEX IF NOT EXISTS "BankStatementImport_organizationId_importHash_key" ON "BankStatementImport"("organizationId", "importHash");
CREATE INDEX IF NOT EXISTS "BankStatementImport_organizationId_idx" ON "BankStatementImport"("organizationId");
CREATE INDEX IF NOT EXISTS "BankStatementImport_bankAccountId_idx" ON "BankStatementImport"("bankAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "BankTransaction_organizationId_transactionHash_key" ON "BankTransaction"("organizationId", "transactionHash");
CREATE INDEX IF NOT EXISTS "BankTransaction_organizationId_idx" ON "BankTransaction"("organizationId");
CREATE INDEX IF NOT EXISTS "BankTransaction_bankAccountId_idx" ON "BankTransaction"("bankAccountId");
CREATE INDEX IF NOT EXISTS "BankTransaction_statementImportId_idx" ON "BankTransaction"("statementImportId");
