# Produktová vízia a MVP roadmapa

## Vízia

Vybudovať slovenský fakturačný a účtovný systém, ktorý spája:

- rýchlu fakturáciu,
- zber nákladov,
- bankové párovanie,
- export pre účtovníka,
- jednoduché účtovníctvo pre živnostníkov,
- podvojné účtovníctvo pre s.r.o.,
- DPH prehľady,
- audit a uzávierky.

Systém má byť jednoduchý pre podnikateľa a dostatočne presný pre účtovníka.

---

# MVP 1.0 — Fakturácia + náklady + banka + export pre účtovníka

## Cieľ

> Slovenský podnikateľ vie vystaviť faktúru, nahrať náklady, importovať banku, spárovať platby a poslať účtovníkovi kompletný mesačný balík.

## Obsah

- organizácie / firmy,
- používatelia a role,
- klienti a dodávatelia,
- vystavené faktúry,
- slovenské PDF faktúry,
- SEPA QR platba,
- IBAN/BIC,
- variabilný symbol,
- DPH sadzby a režimy,
- prijaté faktúry / náklady,
- upload príloh,
- dokladový inbox,
- bankové transakcie,
- import CSV/XLSX/CAMT.053 skeleton,
- párovanie úhrad,
- mesačný checklist,
- export ZIP/XLSX/PDF pre účtovníka,
- audit log,
- číselné rady.

---

# MVP 2.0 — Živnostník

## Obsah

- paušálne výdavky,
- daňová evidencia,
- jednoduché účtovníctvo,
- peňažný denník,
- kniha pohľadávok,
- kniha záväzkov,
- odvody,
- osobné výbery,
- vklady podnikateľa,
- daňová rezerva,
- export podkladov.

## UX princíp

Živnostník nemá byť nútený vidieť účtovnícky jazyk. UI má používať pojmy:

- príjem,
- výdavok,
- faktúra,
- úhrada,
- osobný výber,
- vklad,
- odvody,
- daňová rezerva.

---

# MVP 3.0 — s.r.o.

## Obsah

- účtový rozvrh,
- predkontácie,
- účtovný denník,
- hlavná kniha,
- prijaté faktúry,
- záväzky,
- banka,
- pokladňa,
- DPH evidencia,
- saldo 311/321,
- uzávierky,
- reporty.

## Základné účtovné vzory

```text
Vystavená faktúra:
311 / 602 základ
311 / 343 DPH

Úhrada faktúry:
221 / 311

Prijatá faktúra:
518 / 321 základ
343 / 321 DPH

Úhrada prijatej faktúry:
321 / 221

Bankový poplatok:
568 / 221

Zápočet:
321 / 311
```

---

# MVP 4.0 — Pokročilé moduly

## Obsah

- majetok,
- odpisy,
- sklad,
- mzdy ako integrácia,
- eKasa workflow,
- XML výkazy,
- API bánk,
- OCR,
- klientsky portál,
- platobné brány,
- mobilná PWA,
- účtovnícka kancelária.

---

# Kľúčové produktové odlíšenia

1. Slovenské faktúry a SK DPH od základu.
2. Živnostník aj s.r.o. v jednom systéme.
3. Dokladový inbox.
4. Bankové párovanie s učením pravidiel.
5. Export mesiaca pre účtovníka.
6. Checklist pripravenosti mesiaca.
7. Otázky medzi účtovníkom a klientom priamo pri dokladoch.
8. Bezpečný zostatok po rezervách na DPH, dane a záväzky.
9. Auditovateľné doklady, PDF verzie a číselné rady.
10. Účtovné jadro pripravené na jednoduché aj podvojné účtovníctvo.
