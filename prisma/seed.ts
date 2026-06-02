import { PrismaClient } from "@prisma/client";
import invoiceFixture from "../tests/fixtures/invoice-draft.sample.json";
import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";

const prisma = new PrismaClient();

async function main() {
  const organization = organizationFixture.organization;
  const partner = partnerFixture.partner;
  const invoice = invoiceFixture.invoice;
  const totals = invoiceFixture.totals;

  await prisma.organization.upsert({
    where: { id: organization.id },
    update: {
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      legalForm: organization.legalForm,
      ico: organization.ico,
      dic: organization.dic,
      icDph: organization.icDph,
      country: organization.country,
      defaultCurrency: organization.defaultCurrency,
      updatedAt: new Date(organization.updatedAt)
    },
    create: {
      id: organization.id,
      legalName: organization.legalName,
      tradeName: organization.tradeName,
      legalForm: organization.legalForm,
      ico: organization.ico,
      dic: organization.dic,
      icDph: organization.icDph,
      country: organization.country,
      defaultCurrency: organization.defaultCurrency,
      createdAt: new Date(organization.createdAt),
      updatedAt: new Date(organization.updatedAt)
    }
  });

  await prisma.businessPartner.upsert({
    where: { id: partner.id },
    update: {
      legalName: partner.legalName,
      displayName: partner.displayName,
      partnerType: partner.partnerType,
      country: partner.country,
      language: partner.language,
      defaultDueDays: partner.defaultDueDays,
      defaultCurrency: partner.defaultCurrency,
      updatedAt: new Date(partner.updatedAt)
    },
    create: {
      id: partner.id,
      organizationId: partner.organizationId,
      legalName: partner.legalName,
      displayName: partner.displayName,
      partnerType: partner.partnerType,
      country: partner.country,
      language: partner.language,
      defaultDueDays: partner.defaultDueDays,
      defaultCurrency: partner.defaultCurrency,
      createdAt: new Date(partner.createdAt),
      updatedAt: new Date(partner.updatedAt)
    }
  });

  await prisma.invoice.upsert({
    where: { id: invoice.id },
    update: {
      status: invoice.status,
      number: invoice.number,
      variableSymbol: invoice.variableSymbol,
      netTotal: totals.netTotal,
      vatTotal: totals.vatTotal,
      grossTotal: totals.grossTotal,
      allocatedPaymentsTotal: totals.allocatedPaymentsTotal,
      creditNotesTotal: totals.creditNotesTotal,
      remainingBalance: totals.remainingBalance,
      issueSnapshotJson: invoiceFixture.issueSnapshot,
      updatedAt: new Date(invoice.updatedAt)
    },
    create: {
      id: invoice.id,
      organizationId: invoice.organizationId,
      customerId: invoice.customerId,
      type: invoice.type,
      status: invoice.status,
      number: invoice.number,
      variableSymbol: invoice.variableSymbol,
      currency: invoice.currency,
      issueDate: new Date(invoice.issueDate),
      deliveryDate: new Date(invoice.deliveryDate),
      dueDate: new Date(invoice.dueDate),
      paymentMethod: invoice.paymentMethod,
      vatMode: invoice.vatMode,
      netTotal: totals.netTotal,
      vatTotal: totals.vatTotal,
      grossTotal: totals.grossTotal,
      allocatedPaymentsTotal: totals.allocatedPaymentsTotal,
      creditNotesTotal: totals.creditNotesTotal,
      remainingBalance: totals.remainingBalance,
      issueSnapshotJson: invoiceFixture.issueSnapshot,
      createdAt: new Date(invoice.createdAt),
      updatedAt: new Date(invoice.updatedAt),
      items: {
        create: invoiceFixture.items.map((item) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPriceNet: item.unitPriceNet,
          discountPercent: item.discountPercent,
          vatRateCode: item.vatRateCode,
          vatTreatmentCode: item.vatTreatmentCode,
          lineNet: item.lineNet,
          lineVat: item.lineVat,
          lineGross: item.lineGross
        }))
      }
    }
  });

  await prisma.auditEvent.upsert({
    where: { id: "55555555-5555-4555-8555-555555555555" },
    update: {},
    create: {
      id: "55555555-5555-4555-8555-555555555555",
      organizationId: organization.id,
      entityType: "invoice",
      entityId: invoice.id,
      action: "invoice_draft_seeded",
      actorId: null,
      occurredAt: new Date("2026-01-15T10:00:00Z"),
      oldValueJson: null,
      newValueJson: JSON.stringify({ status: invoice.status, number: invoice.number }),
      reason: "Initial MVP runtime seed",
      previousHash: null,
      currentHash: null
    }
  });

  await prisma.numberSeries.upsert({
    where: { id: "99999999-9999-4999-8999-999999999999" },
    update: {
      organizationId: organization.id,
      documentType: "invoice",
      code: "FV",
      pattern: "FV{YYYY}{NNNN}",
      period: "year",
      assignOn: "issue",
      padding: 4,
      isActive: true,
      updatedAt: new Date("2026-01-01T09:00:00Z")
    },
    create: {
      id: "99999999-9999-4999-8999-999999999999",
      organizationId: organization.id,
      documentType: "invoice",
      code: "FV",
      pattern: "FV{YYYY}{NNNN}",
      period: "year",
      assignOn: "issue",
      padding: 4,
      nextNumber: 1,
      isActive: true,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-01-01T09:00:00Z"),
      updatedAt: new Date("2026-01-01T09:00:00Z")
    }
  });

  await prisma.bankAccount.upsert({
    where: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    update: {
      organizationId: organization.id,
      iban: "SK3112000000198742637541",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: true,
      updatedAt: new Date("2026-01-01T09:00:00Z")
    },
    create: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      organizationId: organization.id,
      iban: "SK3112000000198742637541",
      bic: "SUBASKBX",
      bankName: "Slovenska sporitelna",
      currency: "EUR",
      accountType: "business",
      analyticsAccountCode: "221",
      isDefault: true,
      validFrom: new Date("2026-01-01"),
      validTo: null,
      createdAt: new Date("2026-01-01T09:00:00Z"),
      updatedAt: new Date("2026-01-01T09:00:00Z")
    }
  });
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
