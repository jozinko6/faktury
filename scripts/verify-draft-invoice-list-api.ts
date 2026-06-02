import { prisma } from "../lib/prisma";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";

async function main() {
  const response = await fetch(
    `http://127.0.0.1:3100/api/invoices/drafts?organizationId=${organizationFixture.organization.id}`
  );
  const payload = (await response.json()) as {
    invoices?: Array<{
      id: string;
      status: string;
      number: string | null;
      grossTotal: number;
      itemCount: number;
    }>;
    error?: string;
  };

  if (response.status !== 200 || !payload.invoices) {
    throw new Error(`Expected 200 invoices response, got ${response.status}: ${payload.error}`);
  }

  if (payload.invoices.length === 0) {
    throw new Error("Expected at least one draft invoice in the runtime list.");
  }

  const numberedDraft = payload.invoices.find((invoice) => invoice.number !== null);
  if (numberedDraft) {
    throw new Error(`Draft invoice ${numberedDraft.id} unexpectedly has a number.`);
  }

  const persistedCount = await prisma.invoice.count({
    where: {
      organizationId: organizationFixture.organization.id,
      status: "draft"
    }
  });

  if (persistedCount < payload.invoices.length) {
    throw new Error("List API returned more draft invoices than are persisted.");
  }

  console.log(
    JSON.stringify(
      {
        httpStatus: response.status,
        returnedDrafts: payload.invoices.length,
        persistedDrafts: persistedCount,
        firstDraftNumber: payload.invoices[0]?.number ?? null
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
