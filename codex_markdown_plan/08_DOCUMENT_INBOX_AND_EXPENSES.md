# Dokladový inbox, náklady a prijaté faktúry

Dokladový inbox je centrálny pracovný priestor pre všetko nespracované.

---

# 1. Účel inboxu

Inbox zhromažďuje:

- nahraté PDF,
- fotky bločkov,
- emailom prijaté faktúry,
- bankové transakcie bez dokladu,
- OCR výsledky,
- náklady čakajúce na schválenie,
- otázky od účtovníka.

---

# 2. Stavy inbox položky

```text
new
recognized
needs_info
needs_category
needs_approval
approved
posted
archived
```

Nikdy nezaúčtuj OCR výsledok bez potvrdenia.

---

# 3. Entity

```text
document_inbox_items
documents
document_files
document_links
document_comments
document_questions
```

Dokument môže byť:

- PDF,
- scan,
- fotka,
- email,
- zmluva,
- objednávka,
- dodací list,
- cenová ponuka,
- iný doklad.

Nie každý dokument má účtovný dopad.

---

# 4. Prijaté faktúry

Entity:

```text
received_invoices
received_invoice_items
received_credit_notes
```

Polia:

- dodávateľ,
- číslo faktúry dodávateľa,
- dátum vystavenia,
- dátum dodania,
- dátum prijatia,
- dátum splatnosti,
- suma bez DPH,
- DPH,
- celkom,
- mena,
- IBAN,
- VS,
- kategória,
- DPH režim,
- príloha,
- stav.

---

# 5. Náklady

Náklad môže byť:

- prijatá faktúra,
- bloček,
- banková platba bez dokladu,
- náklad zaplatený súkromne,
- zmiešaný náklad,
- nedaňový náklad,
- náklad na kontrolu.

Stavy:

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

---

# 6. Kategórie nákladov

Predpripravené kategórie:

- softvér,
- telefón,
- internet,
- notebook,
- kancelárske potreby,
- nájom,
- coworking,
- auto,
- PHM,
- cestovné,
- reprezentácia,
- vzdelávanie,
- marketing,
- bankové poplatky,
- poistenie,
- odvody,
- dane,
- na kontrolu.

Každá kategória má:

```text
name
description
simple_accounting_mapping
double_entry_mapping
vat_treatment
tax_deductibility
requires_attachment
requires_note
risk_level
```

---

# 7. Daňová uznateľnosť

Náklad môže byť:

```text
fully_deductible
partially_deductible
non_deductible
review_required
```

Príklady:

- reprezentácia → upozorniť,
- pokuty a penále → nedaňové,
- zmiešaný telefón → percento podnikania,
- notebook → majetok alebo priamy výdavok podľa pravidiel.

---

# 8. Zmiešané náklady

Podporuj rozdelenie:

```text
Telefón 40 €
Podnikanie 80 %
Súkromná časť 20 %
```

Ulož:

```text
business_percentage
private_percentage
```

---

# 9. Náklady zaplatené súkromne

Živnostník často platí zo súkromného účtu.

Stav:

```text
paid_privately
```

UI text:

```text
Toto som platil zo súkromného, ale je to podnikateľský náklad.
```

---

# 10. Billable expenses

Náklady prefakturovateľné klientovi:

- hosting,
- licencie,
- cestovné,
- materiál.

Stavy:

```text
unbilled
included_on_invoice
reimbursed
non_billable
```

---

# 11. Otázky a komentáre

Pri doklade môže byť vlákno:

```text
Účtovník:
Čo je táto platba?

Majiteľ:
Je to USB-C hub do kancelárie.
```

Stavy otázok:

```text
needs_info
answered
approved
resolved
```

---

# 12. Chýbajúce doklady

Systém má zobrazovať:

```text
Platby bez dokladu
Náklady bez prílohy
Doklady na kontrolu
Doklady bez kategórie
Doklady bez DPH režimu
```

Pred exportom mesiaca treba tieto položky vyriešiť alebo uzavrieť s dôvodom.

---

# 13. Duplicity

Detekuj možné duplicity:

- dodávateľ + číslo faktúry,
- rovnaká suma + dátum,
- rovnaký IBAN + VS,
- rovnaký súbor hash.

Pri duplicite zobraz warning.
