import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../prisma";

export type ProcessNextInvoiceEmailJobInput = {
  organizationId: string;
  invoiceId?: string;
  processedAt?: Date;
  emailLogId?: string;
};

export async function processNextInvoiceEmailJob(
  input: ProcessNextInvoiceEmailJobInput,
  client: PrismaClient = defaultPrisma
) {
  const processedAt = input.processedAt ?? new Date();
  const emailLogId = input.emailLogId ?? randomUUID();

  return client.$transaction(async (transaction) => {
    const job = await transaction.emailJob.findFirst({
      where: {
        organizationId: input.organizationId,
        invoiceId: input.invoiceId,
        status: "queued",
        nextAttemptAt: {
          lte: processedAt
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });

    if (!job) {
      return null;
    }

    const updatedJob = await transaction.emailJob.update({
      where: {
        id: job.id
      },
      data: {
        status: "sent_simulated",
        attemptCount: job.attemptCount + 1,
        nextAttemptAt: null,
        processedAt
      }
    });
    const log = await transaction.emailLog.create({
      data: {
        id: emailLogId,
        organizationId: input.organizationId,
        emailJobId: updatedJob.id,
        providerMessageId: null,
        status: "sent_simulated",
        smtpResponse: "Simulated worker run; no email was sent.",
        errorCode: null,
        errorMessage: null,
        createdAt: processedAt
      }
    });

    await transaction.auditEvent.create({
      data: {
        id: randomUUID(),
        organizationId: input.organizationId,
        entityType: "invoice",
        entityId: updatedJob.invoiceId,
        action: "invoice_email_sent_simulated",
        actorId: null,
        occurredAt: processedAt,
        oldValueJson: JSON.stringify({
          emailJobId: job.id,
          status: job.status,
          attemptCount: job.attemptCount
        }),
        newValueJson: JSON.stringify({
          emailJobId: updatedJob.id,
          emailLogId: log.id,
          status: updatedJob.status,
          attemptCount: updatedJob.attemptCount
        }),
        reason: "Invoice email worker simulated send",
        previousHash: null,
        currentHash: null
      }
    });

    return {
      emailJob: updatedJob,
      emailLog: log
    };
  });
}
