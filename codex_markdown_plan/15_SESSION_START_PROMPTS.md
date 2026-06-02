# Session prompty pre Codex

Použi tieto krátke prompty podľa situácie.

---

# 1. Úvodná analýza repozitára

```text
Prejdi aktuálny repozitár a priprav ho na postupnú transformáciu na slovenský fakturačný a účtovný systém pre živnostníkov a s.r.o.

Nerob veľký refactor. Najprv analyzuj:
- štruktúru projektu,
- databázu,
- faktúry,
- PDF,
- DPH,
- banku,
- auth,
- testy,
- české defaulty.

Potom navrhni prvý malý bezpečný patch pre slovenské jadro:
- EUR ako default,
- slovenský tax profile,
- IBAN/BIC,
- IČO/DIČ/IČ DPH,
- slovenské DPH sadzby,
- slovenské číselné rady,
- slovenské texty faktúry.

Postupuj inkrementálne. Neprepisuj zbytočne kód. Po každej zmene uveď zmenené súbory, overenie a ďalší krok.
```

---

# 2. Riadiaci prompt pred každou session

```text
Pokračuj v práci na slovenskom fakturačnom a účtovnom systéme.

Dodrž tieto pravidlá:
1. Najprv si prečítaj aktuálny stav repozitára.
2. Zisti, ktorý krok roadmapy je najbližší nedokončený.
3. Nerob viac ako jeden logický krok naraz.
4. Pred úpravou vypíš krátky plán.
5. Urob minimálny bezpečný patch.
6. Neprepisuj celé súbory, ak stačí lokálna úprava.
7. Nezavádzaj nové knižnice bez dôvodu.
8. Zachovaj existujúci štýl projektu.
9. Po zmene spusti dostupné testy alebo aspoň syntax/type check.
10. Na konci vypíš:
   - čo sa zmenilo,
   - ktoré súbory sa zmenili,
   - ako to bolo overené,
   - čo je ďalší odporúčaný krok.

Ak narazíš na nejasnosť, zastav sa a navrhni 2–3 bezpečné možnosti.
```

---

# 3. Prompt pre fakturačný modul

```text
Implementuj najbližší malý krok vo fakturačnom module podľa dokumentov:
- slovenské faktúry,
- číslo až pri vystavení,
- snapshot,
- PDF hash,
- IBAN/BIC,
- VS,
- DPH treatment,
- audit.

Najprv preskúmaj existujúcu fakturačnú logiku. Potom navrhni minimálny patch. Nerob veľký refactor.
```

---

# 4. Prompt pre banku a párovanie

```text
Implementuj najbližší malý krok v bankovom module:
- bank_accounts,
- bank_transactions,
- CSV import,
- idempotency hash,
- matching candidates,
- confidence score,
- payment allocations.

Najprv preskúmaj existujúce bankové/importné súbory. Potom navrhni minimálny patch.
```

---

# 5. Prompt pre náklady a inbox

```text
Implementuj najbližší malý krok pre náklady a dokladový inbox:
- received invoices,
- expenses,
- attachments,
- inbox states,
- comments/questions,
- missing document workflow.

Najprv zisti, čo už existuje. Potom urob malý patch.
```

---

# 6. Prompt pre mesačný export

```text
Implementuj najbližší malý krok pre mesačný export pre účtovníka:
- obdobie,
- checklist,
- export ZIP,
- manifest,
- hashes,
- audit.

Nerob XML podania. Cieľ je mesačný balík pre účtovníka.
```

---

# 7. Prompt pre audit

```text
Implementuj najbližší malý krok v audit logu:
- kto,
- kedy,
- čo,
- stará hodnota,
- nová hodnota,
- dôvod,
- entity type/id,
- organization id.

Audituj aspoň faktúru, párovanie platby, export a zmenu IBAN.
```

---

# 8. Prompt pre testy

```text
Doplň testy pre aktuálne implementovaný modul. Priorita:
- výpočty faktúr,
- číselné rady,
- DPH sadzby,
- bankový import,
- párovanie,
- export,
- tenant isolation.

Nepíš veľké refactory. Pridaj čo najmenší testovací set, ktorý overí aktuálny krok.
```

---

# 9. Prompt na zastavenie zbytočného refactoru

```text
Zastav veľký refactor. Vráť sa k najmenšiemu ďalšiemu kroku. Najprv vysvetli:
- prečo je zmena potrebná,
- ktoré súbory sa musia meniť,
- aký je minimálny patch,
- ako ho overíš.

Nerob zmeny mimo aktuálneho modulu.
```
