# UI, validačný engine a automatizácie

---

# 1. UI filozofia

Jedna aplikácia, dva pohľady:

## Podnikateľský pohľad

Ukazuj:

- čo treba zaplatiť,
- čo mi majú zaplatiť,
- čo je po splatnosti,
- koľko som zarobil,
- koľko som minul,
- koľko si mám odložiť na DPH/daň,
- čo chýba účtovníkovi.

## Účtovnícky pohľad

Ukazuj:

- účtovný denník,
- hlavnú knihu,
- saldo,
- DPH evidenciu,
- predkontácie,
- uzávierky,
- kontroly,
- exporty.

---

# 2. Dashboard

Widgety:

- neuhradené faktúry,
- záväzky tento týždeň,
- DPH odhad,
- cashflow,
- príjmy tento mesiac,
- chýbajúce doklady,
- úlohy od účtovníka,
- bezpečný zostatok.

---

# 3. „Dnes treba riešiť“

Namiesto grafov ukáž konkrétne kroky:

```text
- zaplatiť faktúru Telekom
- doplniť doklad k platbe Google
- skontrolovať 2 navrhnuté párovania
- poslať upomienku klientovi
```

---

# 4. Režim jednoduché / pokročilé

Pri faktúre:

## Jednoduché

- klient,
- položka,
- suma,
- splatnosť,
- vystaviť.

## Pokročilé

- DPH režim,
- účty,
- stredisko,
- projekt,
- mena,
- kurz,
- reverse charge,
- výkaz prác.

---

# 5. Validačný engine

Vytvor:

```text
ValidationRule
- appliesTo(entity, context)
- validate(entity, context)
```

Výsledok:

```text
error
warning
info
```

---

# 6. Validačné pravidlá

Príklady:

- faktúra musí mať klienta,
- faktúra musí mať položky,
- číslo musí byť unikátne,
- VS musí byť unikátny podľa organizácie,
- IBAN musí byť validný,
- neplatiteľ nesmie fakturovať DPH,
- platiteľ musí mať DPH režim,
- dátum splatnosti nesmie byť pred vystavením,
- doklad v zamknutom období nemožno meniť,
- faktúra po odoslaní sa nemení bez opravy,
- zahraničný doklad potrebuje DPH režim,
- nový IBAN dodávateľa je warning,
- duplicita prijatej faktúry je warning,
- náklad bez prílohy je warning/error podľa pravidiel.

---

# 7. Automatizácie

## Bankové pravidlá

```text
Ak protistrana obsahuje "Sociálna poisťovňa"
→ kategória odvody

Ak protistrana obsahuje "Google Ireland"
→ kategória softvér
→ zahraničná služba
→ vyžaduj faktúru

Ak IBAN patrí vlastnej organizácii
→ interný prevod
```

## Učenie pravidiel

Po ručnom zaradení:

```text
Použiť rovnaké pravidlo aj nabudúce?
```

---

# 8. Opakované náklady

Sleduj:

- Google Workspace,
- Adobe,
- telefón,
- nájom,
- Sociálna poisťovňa,
- zdravotná poisťovňa.

Ak chýba očakávaný doklad, upozorni.

---

# 9. Notifikácie

Kanály:

- in-app,
- email,
- push neskôr,
- webhook.

Typy:

- DPH termín,
- faktúra po splatnosti,
- prišla platba,
- chýba doklad,
- účtovník položil otázku,
- export je pripravený.

Podporuj:

- priority,
- snooze,
- quiet hours.

---

# 10. Globálne vyhľadávanie

Vyhľadávaj cez:

- číslo faktúry,
- klienta,
- sumu,
- IBAN,
- VS,
- IČO,
- email,
- názov prílohy.

---

# 11. Uložené pohľady

Používateľ môže uložiť filtre:

- faktúry po splatnosti,
- náklady bez prílohy,
- bankové transakcie bez párovania,
- doklady na kontrolu.

Každý pohľad exportovateľný do XLSX/CSV/PDF.

---

# 12. Explainability

Pri reporte alebo automatickej akcii ukáž:

```text
Prečo systém navrhol toto?
```

Príklady:

```text
Prečo 221/311?
Lebo transakcia prišla na bankový účet, VS sedí s faktúrou a suma sedí.
```

```text
Prečo reverse charge?
Lebo odberateľ je firma v EÚ, má IČ DPH a položka je služba.
```
