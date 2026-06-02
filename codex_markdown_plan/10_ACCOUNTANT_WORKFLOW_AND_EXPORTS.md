# Workflow účtovníka a exporty

Toto je jedna z hlavných killer features systému.

---

# 1. Mesačný workflow

Každé obdobie má stav:

```text
open
needs_documents
ready_for_accountant
returned_with_questions
in_accounting_review
processed
locked
```

Používateľ klikne:

```text
Mesiac je pripravený pre účtovníka
```

Predtým systém skontroluje:

- banka importovaná,
- faktúry zahrnuté,
- náklady majú prílohy,
- neznáme transakcie vyriešené,
- otázky zodpovedané,
- export je kompletný.

---

# 2. Mesačný checklist

Pre podnikateľa:

```text
[ ] Importovať bankový výpis
[ ] Skontrolovať platby bez dokladu
[ ] Doplniť chýbajúce faktúry
[ ] Schváliť náklady
[ ] Skontrolovať neuhradené faktúry
[ ] Pripraviť export pre účtovníka
[ ] Zamknúť mesiac
```

Pre účtovníka:

```text
[ ] Skontrolovať DPH
[ ] Zaúčtovať interné doklady
[ ] Uzavrieť banku
[ ] Exportovať podklady
[ ] Odoslať klientovi otázky
```

---

# 3. Otázky medzi podnikateľom a účtovníkom

Pri doklade alebo období môže vzniknúť otázka.

Stavy:

```text
needs_info
answered
resolved
returned
```

Príklad:

```text
Účtovník:
Chýba faktúra k platbe Google 12,99 €.

Majiteľ:
Doplnil som PDF.
```

---

# 4. Vrátenie obdobia

Účtovník môže obdobie vrátiť:

```text
returned_with_questions
```

Používateľ vidí:

```text
Účtovník vrátil marec. Treba doplniť 3 veci.
```

---

# 5. Export mesiaca pre účtovníka

Jedno tlačidlo:

```text
Export pre účtovníka za marec 2026
```

ZIP obsah:

```text
vystavené_faktúry/
prijaté_faktúry/
banka/
pokladňa/
prehľady/
dph/
uctovny_export.xlsx
manifest.json
hashes.txt
```

---

# 6. Manifest

Každý export má manifest:

```json
{
  "organization": "...",
  "period": "2026-03",
  "created_at": "...",
  "created_by": "...",
  "files": [
    {
      "path": "vystavene_faktury/FV20260001.pdf",
      "sha256": "..."
    }
  ]
}
```

---

# 7. Audit exportu

Ulož:

- kto export vytvoril,
- kedy,
- obdobie,
- filter,
- počet dokladov,
- hash ZIP,
- hash manifestu,
- zoznam zahrnutých dokladov.

Ak sa po exporte zmení doklad:

```text
Pozor: po exporte sa zmenili 2 doklady.
```

---

# 8. Exporty MVP

MVP exporty:

- PDF faktúry,
- XLSX vystavené faktúry,
- XLSX prijaté faktúry,
- XLSX bankové transakcie,
- XLSX DPH sumarizácia,
- ZIP mesačný balík,
- manifest s hashmi.

---

# 9. Neskoršie exporty

Neskôr:

- XML DPH priznanie,
- XML kontrolný výkaz,
- XML súhrnný výkaz,
- export pre Pohoda SK,
- export pre Omega,
- export pre Money,
- export účtovného denníka,
- trusted archive.

---

# 10. Stav exportu

Obdobie má stav exportu:

```text
not_prepared
prepared
exported
downloaded
accepted_by_accountant
changed_after_export
locked
```

---

# 11. Výzva na doplnenie dokladov

Účtovník môže vybrať chýbajúce doklady a poslať jednu výzvu.

Príklad:

```text
Dobrý deň,

za marec nám chýbajú tieto doklady:
- platba Alza 148,90 €
- platba Google 12,99 €
- hotovostný výber 200 €

Prosíme o doplnenie.
```

---

# 12. Upload link pre klienta

Neskôr:

- bezpečný link,
- expirácia,
- upload bez účtu,
- audit prístupov.
