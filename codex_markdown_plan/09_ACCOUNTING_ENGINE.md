# Účtovný engine

Účtovníctvo má byť jadro systému, ale implementuje sa postupne.

---

# 1. Základný princíp

Faktúra nie je účtovný zápis.

Použi tok:

```text
BusinessDocument
  -> BusinessEvent
    -> AccountingEvent
      -> SimpleAccountingEntry alebo DoubleEntryJournalEntry
```

Príklady eventov:

- invoice.issued,
- invoice.paid,
- expense.approved,
- bank_transaction.matched,
- vat_period.closed,
- year.closed.

---

# 2. Spoločné entity

```text
accounting_periods
vat_periods
business_events
accounting_events
accounting_documents
accounting_locks
audit_log
```

Obdobia:

```text
open
in_review
ready
exported
submitted
locked
reopened
```

---

# 3. Predkontácie

Použi:

```text
posting_rules
- event_type
- organization_type
- accounting_mode
- vat_mode
- valid_from
- valid_to
- version
- lines
```

Rozlišuj:

- system_rule,
- accountant_rule,
- user_rule.

---

# 4. Draft vs posted

Najprv vytvor návrh účtovania:

```text
suggested_posting
```

Účtovník môže potvrdiť:

```text
approved_posting
```

Potom vznikne:

```text
posted_entry
```

Reporty môžu mať prepínač:

- vrátane návrhov,
- iba zaúčtované.

---

# 5. Ručné výnimky

Ak účtovník zmení účtovanie:

```text
manual_override = true
override_reason = "Tento náklad ide na 501, nie 518."
changed_by
changed_at
```

Automat potom nemá túto zmenu prepísať.

---

# 6. Jednoduché účtovníctvo

Entity:

```text
simple_cashbook_entries
receivables_book
payables_book
asset_book
inventory_book
simple_accounting_categories
```

Peňažný denník:

- príjmy ovplyvňujúce základ dane,
- príjmy neovplyvňujúce základ dane,
- výdavky ovplyvňujúce základ dane,
- výdavky neovplyvňujúce základ dane,
- priebežné položky,
- DPH,
- osobná spotreba,
- vklady podnikateľa.

Živnostník nemá byť zahltený účtovníckymi názvami. UI má používať ľudské kategórie.

---

# 7. Paušálne výdavky

Entity:

```text
flat_expense_profiles
income_records
contribution_records
tax_estimate_snapshots
```

Eviduj:

- príjmy,
- uhradené faktúry,
- odvody,
- odhad paušálnych výdavkov,
- odhad dane,
- ročný prehľad.

Výpočty označ ako informatívne, ak nie sú právne garantované.

---

# 8. Daňová evidencia

Eviduj:

- príjmy,
- daňové výdavky,
- majetok,
- zásoby,
- pohľadávky,
- záväzky.

---

# 9. Podvojné účtovníctvo

Entity:

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

Účtový rozvrh:

- 0 — dlhodobý majetok,
- 1 — zásoby,
- 2 — finančné účty,
- 3 — zúčtovacie vzťahy,
- 4 — kapitálové účty,
- 5 — náklady,
- 6 — výnosy,
- 7 — závierkové a podsúvahové účty.

Príklady analytík:

```text
221001 Fio
221002 Tatra banka
311001 Odberatelia tuzemsko
321001 Dodávatelia tuzemsko
518001 Softvér
568001 Bankové poplatky
602001 Služby SK
602002 Služby EÚ
```

---

# 10. Základné účtovné vzory

```text
Vystavená faktúra:
MD 311 / D 602 základ
MD 311 / D 343 DPH

Úhrada faktúry:
MD 221 / D 311

Prijatá faktúra:
MD 518 / D 321 základ
MD 343 / D 321 DPH

Úhrada prijatej faktúry:
MD 321 / D 221

Bankový poplatok:
MD 568 / D 221

Zápočet:
MD 321 / D 311
```

---

# 11. Immutable ledger princíp

Po zaúčtovaní nemen zápis priamo.

Použi:

```text
pôvodný zápis
storno zápis
nový opravený zápis
```

Aspoň pre zamknuté obdobia.

---

# 12. Kontroly

Samostatná stránka kontrol:

- banky sedia,
- saldo 311 sedí,
- saldo 321 sedí,
- DPH report sedí,
- číselné rady sedia,
- neexistujú nezaúčtované doklady,
- neexistujú neznáme transakcie.

Pri nesúlade vysvetli možné príčiny.
