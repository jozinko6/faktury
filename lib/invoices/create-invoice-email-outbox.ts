import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export type CreateInvoiceEmailOutboxInput = {
  invoiceId: string;
  organizationId: string;
  pdfVersionId: string;
  to: string[];
  id?: string;
  auditEventId?: string;
  emailJobId?: string;
  emailLogId?: string;
  createdBy?: string | null;
  createdAt?: Date;
};

function assertEmailAddresses(to: string[]) {
  if (to.length === 0) {
    throw new Error("Invoice email outbox job must have at least one recipient.");
  }

  to.forEach((email) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid invoice email recipient: ${email}.`);
    }
  });
}

export async function createInvoiceEmailOutbox(
  input: CreateInvoiceEmailOutboxInput,
  client: PrismaClient = defaultPrisma
) {
  assertEmailAddresses(input.to);

  const createdAt = input.createdAt ?? new Date();
  const eventId = input.id ?? randomUUID();
  const auditEventId = input.auditEventId ?? randomUUID();
  const emailJobId = input.emailJobId ?? randomUUID();
  const emailLogId = input.emailLogId ?? randomUUID();

  return client.$transaction(async (transaction) => {
    const invoice = await transaction.invoice.findFirst({
      where: {
        id: input.invoiceId,
        organizationId: input.organizationId
      },
      include: {
        customer: true
      }
    });

    if (!invoice) {
      throw new Error("Invoice was not found for the selected organization.");
    }

    if (invoice.status !== "issued" || !invoice.number) {
      throw new Error(`Email outbox can only be queued for issued invoices. Current status: ${invoice.status}.`);
    }

    const pdfVersion = await transaction.invoicePdfVersion.findFirst({
      where: {
        id: input.pdfVersionId,
        invoiceId: invoice.id,
        organizationId: input.organizationId,
        metadataOnly: false,
        status: "rendered"
      }
    });

    if (!pdfVersion) {
      throw new Error("Rendered PDF version was not found for the selected invoice.");
    }

    const event = await transaction.invoiceEmailEvent.create({
      data: {
        id: eventId,
        organizationId: input.organizationId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        pdfVersionId: pdfVersion.id,
        occurredAt: createdAt,
        createdBy: input.createdBy ?? null
      }
    });
    const subject = `Faktura ${invoice.number}`;
    const bodyTextSnapshot = [
      `Dobry den,`,
      "",
      `v prilohe posielame fakturu ${invoice.number}.`,
      `Suma na uhradu: ${invoice.remainingBalance.toString()} ${invoice.currency}.`,
      invoice.variableSymbol ? `Variabilny symbol: ${invoice.variableSymbol}.` : null,
      "",
      "Tento email je pripraveny v outboxe a este nebol odoslany."
    ]
      .filter((line): line is string => line !== null)
      .join("\n");

    const emailJob = await transaction.emailJob.create({
      data: {
        id: emailJobId,
        organizationId: input.organizationId,
        eventId: event.id,
        invoiceId: invoice.id,
        pdfVersionId: pdfVersion.id,
        templateCode: "invoice_send",
        language: invoice.customer.language,
        toJson: JSON.stringify(input.to),
        ccJson: null,
        bccJson: null,
        replyTo: null,
        subject,
        bodyHtmlSnapshot: null,
        bodyTextSnapshot,
        attachmentFileIdsJson: JSON.stringify([pdfVersion.fileId]),
        status: "queued",
        attemptCount: 0,
        maxAttempts: 3,
        nextAttemptAt: createdAt,
        createdAt,
        processedAt: null
      }
    });

    const emailLog = await transaction.emailLog.create({
      data: {
        id: emailLogId,
        organizationId: input.organizationId,
        emailJobId: emailJob.id,
        providerMessageId: null,
        status: "queued",
        smtpResponse: null,
        errorCode: null,
        errorMessage: null,
        createdAt
      }
    });

    await transaction.auditEvent.create({
      data: {
        id: auditEventId,
        organizationId: input.organizationId,
        entityType: "invoice",
        entityId: invoice.id,
        action: "invoice_email_outbox_queued",
        actorId: input.createdBy ?? null,
        occurredAt: createdAt,
        oldValueJson: null,
        newValueJson: JSON.stringify({
          emailEventId: event.id,
          emailJobId: emailJob.id,
          emailLogId: emailLog.id,
          pdfVersionId: pdfVersion.id,
          templateCode: emailJob.templateCode,
          status: emailJob.status,
          to: input.to
        }),
        reason: "Invoice email outbox queued",
        previousHash: null,
        currentHash: null
      }
    });

    return {
      event,
      emailJob,
      emailLog
    };
  });
}
