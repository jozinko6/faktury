# Fakturačný modul

Fakturačný modul má byť slovenský od základu.

---

# 1. Typy fakturačných dokladov

Podporuj:

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

V MVP stačí:

- faktúra,
- zálohová faktúra,
- opravná faktúra / dobropis,
- storno.

---

# 2. Stavy faktúry

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

Pravidlá:

- draft možno meniť,
- issued má pridelené číslo,
- sent sa nesmie meniť bez opravy,
- paid má nemennú sumu a klienta,
- locked je v uzavretom období.

---

# 3. Číslovanie

Číslo faktúry prideľ až pri vystavení.

Draft nemá číslo.

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

Vystavenie faktúry musí byť atomická operácia:

```text
- validácia
- pridelenie čísla
- uloženie snapshotu
- výpočet súm
- vytvorenie PDF
- hash PDF
- event InvoiceIssued
```

Ak niečo zlyhá, stav musí byť jasný.

---

# 4. Povinné polia PDF faktúry

PDF faktúra musí podporovať:

- Dodávateľ,
- Odberateľ,
- IČO,
- DIČ,
- IČ DPH,
- dátum vystavenia,
- dátum dodania,
- dátum splatnosti,
- forma úhrady,
- variabilný symbol,
- konštantný symbol,
- špecifický symbol,
- IBAN,
- BIC/SWIFT,
- položky,
- jednotky,
- cena bez DPH,
- sadzba DPH,
- základ dane,
- DPH,
- celkom,
- celkom na úhradu,
- poznámka pre klienta,
- interná poznámka oddelene.

---

# 5. Snapshot faktúry

Pri vystavení ulož snapshot:

```text
supplier_snapshot
customer_snapshot
bank_snapshot
vat_snapshot
items_snapshot
totals_snapshot
texts_snapshot
template_version
```

Staré faktúry sa nesmú meniť pri zmene adresy, IBAN alebo šablóny.

---

# 6. PDF verzie

Ukladaj:

```text
invoice_pdf_versions
- invoice_id
- version
- file_id
- pdf_hash
- snapshot_hash
- template_version
- render_version
- created_by
- created_at
- reason
```

Odoslané PDF nikdy potichu nemenit.

---

# 7. QR platba

Pre Slovensko používaj SEPA QR.

Dáta:

- IBAN,
- BIC,
- suma,
- mena EUR,
- variabilný symbol,
- správa pre prijímateľa,
- názov príjemcu.

---

# 8. Rýchla faktúra

Flow:

```text
1. vyber klienta
2. zadaj položku
3. suma
4. vystaviť
5. poslať
```

Systém doplní:

- splatnosť,
- IBAN,
- VS,
- DPH režim podľa profilu,
- QR kód,
- PDF,
- email.

---

# 9. Pokročilá faktúra

Pre účtovníka alebo s.r.o. podporuj:

- DPH režim,
- účet výnosu,
- projekt,
- stredisko,
- analytiku,
- cudzia mena,
- kurz,
- reverse charge,
- výkaz prác,
- prílohy.

---

# 10. Opakované faktúry

Podporuj:

- mesačné,
- kvartálne,
- ročné,
- paušálne,
- podľa výkazu prác,
- kombinované.

Stavy:

```text
scheduled
generated
sent
paused
ended
```

---

# 11. Projektová fakturácia

Projekt má:

- klienta,
- názov,
- hodinovú sadzbu,
- rozpočet,
- mesačný limit,
- ročný limit,
- fakturačný email,
- výkaz prác.

Výkaz prác:

- dátum,
- popis,
- hodiny,
- sadzba,
- fakturovateľné,
- zahrnuté vo faktúre.

---

# 12. Upomienky

Podporuj emailové šablóny:

- odoslanie faktúry,
- prvá upomienka,
- druhá upomienka,
- formálna výzva,
- poďakovanie za úhradu.

Klient môže mať automatické upomienky vypnuté.

---

# 13. Validácie faktúry

Pravidlá:

- faktúra musí mať klienta,
- položky musia mať názov a sumu,
- DPH režim musí sedieť s tax profilom,
- neplatiteľ nesmie fakturovať DPH,
- IBAN musí byť validný,
- dátum splatnosti nesmie byť pred vystavením,
- číslo faktúry musí byť unikátne,
- VS musí byť unikátny podľa pravidiel,
- odoslaná faktúra sa nemení bez opravy,
- doklad v zamknutom období sa nemení.
