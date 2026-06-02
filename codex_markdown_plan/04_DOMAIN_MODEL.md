# Doménový a databázový model

Tento dokument popisuje cieľový doménový model. Codex ho nemá implementovať naraz. Má ho používať ako mapu pri postupnom vývoji.

---

# 1. Organizácie a používatelia

## Entity

```text
organizations
organization_profiles
organization_profile_history
tax_profiles
users
organization_users
roles
permissions
```

## Organizácia

Organizácia reprezentuje podnikateľský subjekt:

- živnostník,
- s.r.o.,
- iný subjekt neskôr.

Polia:

```text
id
uuid
legal_name
trade_name
legal_form
ico
dic
ic_dph
default_currency
created_at
updated_at
```

## Tax profile

Daňový profil musí byť historizovaný.

```text
tax_profiles
- organization_id
- valid_from
- valid_to
- legal_form: sole_trader / sro
- accounting_mode: flat_expenses / tax_evidence / simple_accounting / double_entry
- vat_mode: non_payer / payer / section_7 / section_7a
- vat_periodicity: monthly / quarterly / none
- income_tax_mode
```

Organizácia môže meniť režimy v čase. Preto nepoužívaj iba jeden checkbox.

---

# 2. Partneri

Použi jednotný model pre klientov aj dodávateľov.

```text
business_partners
partner_addresses
partner_contacts
partner_bank_accounts
partner_tax_ids
partner_risk_flags
```

Partner môže byť:

- customer,
- supplier,
- both.

## Partner fields

```text
legal_name
display_name
ico
dic
ic_dph
country
partner_type
language
default_due_days
default_currency
note
```

## Adresy

Podporuj:

- sídlo,
- fakturačnú adresu,
- dodaciu adresu,
- korešpondenčnú adresu.

```text
street
street_number
city
postal_code
country
address_type
```

## Kontakty

Podporuj:

- fakturačný email,
- obchodný kontakt,
- technický kontakt,
- účtovník,
- konateľ.

## Bankové účty partnera

```text
iban
bic
bank_name
currency
is_default
is_verified
valid_from
valid_to
```

Pri zmene IBAN vytvor audit event.

---

# 3. Dokladové jadro

Rozlišuj:

```text
Document
- upload, PDF, scan, email, zmluva, príloha

BusinessDocument
- vystavená faktúra
- prijatá faktúra
- pokladničný doklad
- interný doklad

AccountingDocument
- účtovný prípad, ktorý vstupuje do účtovníctva
```

Nie každý upload je účtovný doklad.

---

# 4. Faktúry

```text
invoices
invoice_items
invoice_snapshots
invoice_pdf_versions
invoice_email_logs
invoice_number_reservations
invoice_status_history
```

## Typy dokladov

```text
invoice
proforma
advance_payment_tax_document
final_settlement_invoice
credit_note
corrective_invoice
cancellation
internal_document
```

## Stavy

```text
draft
ready
issued
sent
delivered
partially_paid
paid
overdue
overpaid
cancelled
corrected
locked
```

Číslo faktúry sa pridelí až pri vystavení, nie pri drafte.

---

# 5. Číselné rady

```text
number_series
number_series_counters
number_reservations
```

Vzory:

```text
FV{YYYY}{NNNN}
ZF{YYYY}{NNNN}
OF{YYYY}{NNNN}
PF{YYYY}{NNNN}
PPD{YYYY}{NNNN}
VPD{YYYY}{NNNN}
ID{YYYY}{NNNN}
```

Požiadavky:

- transakčný zámok,
- bezpečné pri súbehu,
- audit rezervácie čísla,
- evidencia preskočených / stornovaných čísel,
- číslo neprideľovať draftu.

---

# 6. Prijaté faktúry a náklady

```text
received_invoices
received_invoice_items
expenses
expense_items
expense_attachments
expense_status_history
```

## Stavy

```text
draft
inbox
recognized
needs_info
submitted
approved
rejected
posted
paid
archived
```

Náklad môže byť:

- podnikateľský,
- súkromný,
- zmiešaný,
- nedaňový,
- na kontrolu účtovníkom.

---

# 7. Dokumentový inbox

```text
document_inbox_items
documents
document_files
document_links
document_comments
document_questions
```

Workflow:

```text
new -> recognized -> reviewed -> approved -> posted -> archived
```

---

# 8. Banka

```text
bank_accounts
bank_statements
bank_transactions
bank_transaction_imports
bank_matching_rules
bank_match_candidates
bank_match_decisions
payments
payment_allocations
```

Platba môže byť:

- jedna platba na jednu faktúru,
- jedna platba na viac faktúr,
- viac platieb na jednu faktúru,
- čiastočná úhrada,
- preplatok,
- refund,
- chargeback,
- interný prevod,
- bankový poplatok.

---

# 9. Účtovníctvo

## Spoločné jadro

```text
accounting_periods
vat_periods
business_events
accounting_events
accounting_documents
accounting_locks
audit_log
```

## Jednoduché účtovníctvo

```text
simple_cashbook_entries
receivables_book
payables_book
asset_book
inventory_book
simple_accounting_categories
```

## Podvojné účtovníctvo

```text
chart_of_accounts
journal_entries
journal_entry_lines
posting_rules
posting_rule_versions
ledger_balances
account_balances
cost_centers
analytic_accounts
```

---

# 10. DPH

```text
vat_rates
vat_treatments
vat_entries
vat_periods
vat_report_snapshots
vat_report_exports
```

Nepoužívaj len percento DPH. Použi aj `vat_treatment`.
