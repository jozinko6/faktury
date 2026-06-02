# Testovanie a QA

Od začiatku vytváraj testovacie scenáre. Účtovný systém bez testov je rizikový.

---

# 1. Základné testovacie scenáre

Priprav fixtures:

- živnostník neplatiteľ DPH,
- živnostník platiteľ DPH,
- živnostník s paušálom,
- s.r.o. neplatiteľ DPH,
- s.r.o. platiteľ DPH,
- faktúra na Slovensko,
- faktúra do EÚ,
- prijatá faktúra z Google Ireland,
- čiastočná úhrada,
- preplatok,
- dobropis,
- zálohová faktúra,
- kurzový rozdiel,
- interný prevod,
- bankový poplatok.

---

# 2. Testy faktúr

Testuj:

- súčet položiek,
- základ dane,
- DPH,
- celkom,
- zľavy,
- viac sadzieb,
- zaokrúhľovanie,
- dobropisy,
- proformy,
- snapshot,
- PDF povinné polia.

---

# 3. Testy číselných radov

Testuj:

- číslo vzniká až pri vystavení,
- draft nemá číslo,
- unikátnosť,
- súbeh dvoch vystavení naraz,
- rezervované číslo,
- zlyhané vystavenie,
- audit rezervácie.

---

# 4. Testy DPH

Testuj:

- sadzba podľa dátumu,
- neplatiteľ bez DPH,
- platiteľ s DPH,
- reverse charge,
- zahraničná služba,
- oslobodené plnenie,
- mimo predmet DPH,
- DPH report.

---

# 5. Testy banky

Testuj:

- import CSV,
- import idempotency,
- duplicitná transakcia,
- párovanie podľa VS,
- párovanie podľa sumy,
- párovanie podľa IBAN,
- nízka istota nevykoná auto-match,
- čiastočná úhrada,
- preplatok,
- interný prevod.

---

# 6. Testy nákladov

Testuj:

- prijatá faktúra,
- náklad bez prílohy,
- duplicita dodávateľ + číslo faktúry,
- zmiešaný náklad,
- nedaňový náklad,
- náklad na kontrolu,
- väzba na bankovú transakciu.

---

# 7. Testy účtovníctva

Pre PÚ:

- 311/602/343 pri vystavenej faktúre,
- 221/311 pri úhrade,
- 518/321 pri prijatej faktúre,
- 321/221 pri úhrade,
- 568/221 pri poplatku,
- 321/311 pri zápočte.

Pre JÚ:

- príjem ovplyvňujúci základ dane,
- výdavok ovplyvňujúci základ dane,
- priebežné položky,
- osobný výber,
- vklad podnikateľa.

---

# 8. Testy exportov

Testuj:

- ZIP obsahuje správne súbory,
- manifest obsahuje hash,
- hash sedí,
- export audit log,
- zmena po exporte označí obdobie ako changed_after_export.

---

# 9. Testy bezpečnosti

Testuj:

- tenant isolation,
- role permissions,
- field-level permissions neskôr,
- audit log,
- zmena IBAN,
- zamknuté obdobie,
- nemožnosť editovať locked doklad.

---

# 10. Golden master PDF testy

PDF sa môže meniť vizuálne, ale musí obsahovať povinné texty.

Testuj extrakciu textu:

- číslo faktúry,
- dodávateľ,
- odberateľ,
- IČO,
- DIČ,
- IČ DPH,
- IBAN,
- VS,
- suma,
- DPH,
- dátumy,
- povinný text neplatiteľa / reverse charge.

---

# 11. Property-based testy

Ak projekt umožňuje, pridaj property-based testy:

- základ + DPH = celkom,
- alokácie platieb nesmú rozbiť zostatok,
- dobropis nesmie prekročiť pôvodnú faktúru bez override,
- import rovnakého súboru nevytvorí duplicity.

---

# 12. Overenie pri každom kroku

Codex má po každej zmene spustiť dostupné:

- unit testy,
- integration testy,
- typecheck,
- lint,
- syntax check,
- migration check.

Ak testy nie je možné spustiť, musí uviesť prečo.
