# Presná implementačná postupnosť pre Codex

Tento dokument určuje poradie práce. Codex nemá preskakovať kroky.

---

# Krok 1 — Analýza existujúceho repozitára

Preskúmaj:

- štruktúru projektu,
- backend framework,
- frontend framework,
- databázové migrácie,
- fakturačný modul,
- PDF generovanie,
- bankové importy,
- DPH model,
- auth,
- testy.

Výstup:

```text
- čo už existuje
- čo je CZ-specific
- čo sa dá použiť
- čo treba nahradiť
- riziká
- navrhovaný minimálny prvý patch
```

Nerob ešte veľký refactor.

---

# Krok 2 — Slovenské konfiguračné jadro

Pridaj alebo navrhni:

- EUR ako default,
- SK tax profile,
- IBAN/BIC,
- IČO/DIČ/IČ DPH,
- slovenské DPH sadzby,
- slovenské číselné rady,
- slovenské texty faktúry.

---

# Krok 3 — Organizácia a tax profile

Implementuj alebo rozšír:

- organization,
- organization profile,
- tax profile,
- accounting mode,
- vat mode,
- históriu režimov.

---

# Krok 4 — Partneri

Implementuj jednotný model klient/dodávateľ:

- business partner,
- adresy,
- kontakty,
- bankové účty,
- tax IDs,
- snapshot do dokladov.

---

# Krok 5 — Fakturačný základ

Implementuj:

- draft faktúru,
- položky,
- výpočet súm,
- DPH režim,
- vystavenie,
- stav faktúry.

---

# Krok 6 — Číselné rady

Implementuj:

- number_series,
- number_reservations,
- transakčné pridelenie čísla,
- draft bez čísla,
- audit rezervácie.

---

# Krok 7 — Snapshot faktúry

Pri vystavení ulož:

- dodávateľ snapshot,
- odberateľ snapshot,
- bank snapshot,
- item snapshot,
- vat snapshot,
- totals snapshot.

---

# Krok 8 — Slovenské PDF

Vytvor slovenskú PDF šablónu:

- dodávateľ,
- odberateľ,
- IČO/DIČ/IČ DPH,
- IBAN/BIC,
- VS,
- dátumy,
- DPH,
- slovenské texty,
- QR platba.

Ulož PDF hash.

---

# Krok 9 — Email odoslanie faktúry

Použi outbox pattern:

- invoice issued,
- email job created,
- worker odošle email,
- email log updated.

---

# Krok 10 — Bankové transakcie

Pridaj:

- bank accounts,
- bank transactions,
- import skeleton,
- CSV import,
- import hash,
- transaction hash.

---

# Krok 11 — Párovanie platieb

Implementuj:

- matching candidates,
- confidence score,
- match decision,
- payment allocations,
- status faktúry podľa zostatku.

---

# Krok 12 — Náklady a prijaté faktúry

Implementuj:

- received invoices,
- expenses,
- expense items,
- attachments,
- kategórie,
- stav,
- väzba na banku.

---

# Krok 13 — Dokladový inbox

Pridaj:

- inbox items,
- upload,
- stav,
- komentáre,
- otázky,
- prepojenie na náklad/faktúru/banku.

---

# Krok 14 — Mesačné obdobie a checklist

Implementuj:

- monthly period,
- checklist,
- status `ready_for_accountant`,
- missing documents summary.

---

# Krok 15 — Export pre účtovníka

Implementuj:

- ZIP,
- PDF faktúry,
- XLSX/CSV zoznamy,
- bankové transakcie,
- DPH sumarizáciu,
- manifest,
- hashes.

---

# Krok 16 — Audit log

Pridaj audit pre:

- faktúra vystavená,
- faktúra odoslaná,
- platba spárovaná,
- náklad schválený,
- export vytvorený,
- IBAN zmenený.

---

# Krok 17 — DPH report skeleton

Pridaj:

- vat_entries,
- vat_periods,
- DPH sumarizácia,
- XLSX/CSV export.

XML nerob.

---

# Krok 18 — Jednoduché účtovníctvo skeleton

Pridaj:

- peňažný denník,
- pohľadávky,
- záväzky,
- kategórie,
- príjmy/výdavky.

---

# Krok 19 — Podvojné účtovníctvo skeleton

Pridaj:

- účtový rozvrh,
- journal_entries,
- journal_entry_lines,
- posting_rules,
- draft postings.

Neaktivuj ako hlavné účtovníctvo, kým nebude stabilné.

---

# Krok 20 — UI vrstvy

Postupne pridaj UI:

- dashboard,
- faktúry,
- partneri,
- banka,
- náklady,
- inbox,
- mesačný checklist,
- export pre účtovníka.

---

# Krok 21 — Validácie

Pridaj validation engine:

- IBAN,
- faktúra,
- DPH,
- číselné rady,
- zamknuté obdobia,
- chýbajúce doklady.

---

# Krok 22 — Testy

Ku každému modulu pridaj testy:

- faktúry,
- číselné rady,
- DPH,
- bankový import,
- párovanie,
- export,
- tenant isolation.

---

# Krok 23 — Refactor až po stabilizácii

Refactor rob až keď:

- testy prechádzajú,
- MVP flow funguje,
- existuje jasný dôvod,
- zmena je izolovaná.

---

# Krok 24 — Čo nerobiť pred MVP 1.0

Nerob:

- XML podania,
- eKasa,
- mzdy,
- sklad,
- OCR ako povinnosť,
- bankové PSD2 API,
- klientsky portál,
- platobné brány,
- full PÚ.
