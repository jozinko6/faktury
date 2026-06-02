import organizationFixture from "../tests/fixtures/organization-profile.sample.json";
import partnerFixture from "../tests/fixtures/business-partner.sample.json";
import invoiceFixture from "../tests/fixtures/invoice-draft.sample.json";
import { BankImportPanel } from "./bank-import-panel";
import { CreateDraftInvoicePanel } from "./create-draft-invoice-panel";

const formatter = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR"
});

const defaultBankAccountId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

export default function Home() {
  const organization = organizationFixture.organization;
  const partner = partnerFixture.partner;
  const invoice = invoiceFixture.invoice;
  const totals = invoiceFixture.totals;

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <h1>Uctovnik MVP runtime</h1>
          <p>
            Minimalny Next.js skeleton pre prvy slovensky fakturacny slice:
            organizacia, partner a draft faktura bez prideleneho cisla.
          </p>
        </div>
        <div className="statusBox" aria-label="Stav MVP runtime">
          <span>Runtime slice</span>
          <strong>Draft faktura</strong>
        </div>
      </section>

      <section className="grid" aria-label="MVP fixture prehlad">
        <article>
          <span className="label">Organizacia</span>
          <h2>{organization.legalName}</h2>
          <dl>
            <div>
              <dt>Krajina</dt>
              <dd>{organization.country}</dd>
            </div>
            <div>
              <dt>Mena</dt>
              <dd>{organization.defaultCurrency}</dd>
            </div>
            <div>
              <dt>ICO</dt>
              <dd>{organization.ico}</dd>
            </div>
          </dl>
        </article>

        <article>
          <span className="label">Partner</span>
          <h2>{partner.legalName}</h2>
          <dl>
            <div>
              <dt>Typ</dt>
              <dd>{partner.partnerType}</dd>
            </div>
            <div>
              <dt>Splatnost</dt>
              <dd>{partner.defaultDueDays} dni</dd>
            </div>
            <div>
              <dt>Mena</dt>
              <dd>{partner.defaultCurrency}</dd>
            </div>
          </dl>
        </article>

        <article>
          <span className="label">Draft faktura</span>
          <h2>{formatter.format(totals.grossTotal)}</h2>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{invoice.status}</dd>
            </div>
            <div>
              <dt>Cislo</dt>
              <dd>{invoice.number ?? "zatial nepridelene"}</dd>
            </div>
            <div>
              <dt>Zostatok</dt>
              <dd>{formatter.format(totals.remainingBalance)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <CreateDraftInvoicePanel organizationId={organization.id} customerId={partner.id} />
      <BankImportPanel organizationId={organization.id} bankAccountId={defaultBankAccountId} />
    </main>
  );
}
