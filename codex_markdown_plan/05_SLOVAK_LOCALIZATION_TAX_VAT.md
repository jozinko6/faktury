# Slovenská lokalizácia, dane a DPH

Systém je čisto slovenský. Česká logika a české defaulty sa nesmú používať ako primárny model.

---

# 1. Slovenské identifikátory

Organizácia, klient alebo dodávateľ môže mať:

- IČO,
- DIČ,
- IČ DPH,
- obchodné meno,
- právnu formu,
- sídlo,
- fakturačnú adresu,
- korešpondenčnú adresu,
- zápis v ORSR / ŽRSR,
- IBAN,
- BIC/SWIFT.

## Validácie

Základné validácie:

```text
IČO: typicky 8 číslic
DIČ: typicky 10 číslic
IČ DPH: SK + 10 číslic
IBAN: platný IBAN formát
BIC: voliteľný, ale validovať ak je vyplnený
```

VIES lookup môže slúžiť na overenie IČ DPH.

---

# 2. Bankové údaje

Default pre Slovensko:

- EUR,
- IBAN,
- BIC/SWIFT,
- variabilný symbol,
- špecifický symbol,
- konštantný symbol,
- SEPA QR platba.

České číslo účtu + kód banky nepoužívaj ako primárny model.

---

# 3. DPH režimy

Podporuj minimálne:

```text
non_payer
payer
section_7
section_7a
domestic_standard
domestic_reduced
domestic_zero
reverse_charge
eu_service
eu_goods
import_service
outside_eu
exempt
outside_scope
```

Neukladaj iba sadzbu. Každý doklad/položka potrebuje aj DPH režim.

---

# 4. DPH sadzby

Sadzby musia byť dátumovo platné.

Seed/config:

```text
SK-23
SK-19
SK-5
SK-0
SK-RC
```

Príklad tabuľky:

```text
vat_rates
- id
- code
- country
- rate_percent
- valid_from
- valid_to
- is_default
- is_reverse_charge
- label
```

Príklad:

```text
SK-23  základná sadzba
SK-19  znížená sadzba
SK-5   znížená sadzba
SK-0   oslobodené / mimo DPH
SK-RC  prenesenie daňovej povinnosti
```

---

# 5. DPH treatment

Príklad tabuľky:

```text
vat_treatments
- id
- code
- name
- description
- affects_vat_return
- affects_control_statement
- affects_summary_statement
- reverse_charge
- outside_scope
```

Príklady treatmentov:

```text
domestic_goods_or_services
domestic_reduced_rate
exempt_supply
reverse_charge_eu_service
reverse_charge_domestic
outside_scope
non_vat_payer_invoice
import_service
eu_goods
```

---

# 6. Dátum dodania a DPH obdobie

DPH sa nemá určovať iba podľa dátumu vystavenia.

Pracuj s dátumami:

```text
issue_date
delivery_date
tax_point_date
received_date
due_date
payment_date
posting_date
```

DPH obdobie sa má odvodzovať najmä z dátumu dodania / daňovej povinnosti podľa režimu.

---

# 7. Texty na faktúre

Automaticky vlož text podľa režimu:

```text
Nie som platiteľom DPH.
Prenesenie daňovej povinnosti.
Dodanie je oslobodené od dane.
Dodávateľ je zapísaný v živnostenskom registri...
Spoločnosť je zapísaná v obchodnom registri...
```

Texty musia byť konfigurovateľné a lokalizované.

---

# 8. Jazyk

Podporuj:

- SK,
- EN,
- CZ,
- DE,
- HU.

Rozlišuj:

```text
UI jazyk používateľa
jazyk faktúry klienta
jazyk emailu klienta
```

---

# 9. Slovenské pojmy v UI

Používaj:

```text
Dodávateľ
Odberateľ
IČO
DIČ
IČ DPH
Dátum vystavenia
Dátum dodania
Dátum splatnosti
Forma úhrady
Variabilný symbol
Konštantný symbol
Špecifický symbol
IBAN
BIC/SWIFT
Sadzba DPH
Základ dane
DPH
Celkom na úhradu
Faktúra
Zálohová faktúra
Opravná faktúra
Dobropis
Prijatá faktúra
Výdavok
Úhrada
```

---

# 10. DPH reporty

MVP nerobí priame XML podania.

MVP má pripraviť:

- DPH sumarizáciu,
- vstupnú DPH,
- výstupnú DPH,
- doklady podľa režimov,
- reverse charge,
- export XLSX/CSV,
- podklady pre účtovníka.

XML podania prídu neskôr.
