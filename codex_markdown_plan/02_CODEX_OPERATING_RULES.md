# Pravidlá práce pre Codex

Tento dokument má Codex dodržiavať pri každej session.

## Najdôležitejšie pravidlo

**Nerob veľké zmeny naraz.**

Najprv analyzuj. Potom navrhni malý patch. Potom implementuj. Potom over.

---

## Povinný postup

Pri každej úlohe:

1. Preskúmaj aktuálny stav relevantných súborov.
2. Zhrň, čo existuje.
3. Urči, ktorý krok roadmapy sa práve rieši.
4. Navrhni minimálny plán zmien.
5. Urob iba zmeny potrebné pre tento krok.
6. Zachovaj existujúci štýl kódu.
7. Nezavádzaj nové knižnice bez jasného dôvodu.
8. Neprepisuj celé súbory, ak stačí menší diff.
9. Spusti dostupné testy alebo aspoň syntax/type check.
10. Vypíš výsledok, riziká a ďalší krok.

---

## Zakázané

Nerob:

- full ERP naraz,
- veľký refactor bez schválenia,
- XML daňové podania v MVP,
- eKasa v MVP,
- mzdy v MVP,
- sklad v MVP,
- OCR ako povinnú súčasť MVP,
- automatické zaúčtovanie OCR bez potvrdenia,
- automatické párovanie platieb s nízkou istotou,
- generovanie čísla faktúry pri drafte,
- zmenu starého PDF po vystavení,
- mazanie účtovných dokladov natvrdo,
- obchádzanie audit logu,
- ignorovanie zamknutých období,
- použitie českých defaultov ako primárneho modelu.

---

## Čo robiť pri nejasnosti

Ak nie je jasné, ako pokračovať:

1. zastav sa,
2. popíš problém,
3. navrhni 2–3 bezpečné možnosti,
4. odporuč najmenší ďalší krok.

---

## Priorita vývoja

1. Slovenské konfiguračné jadro.
2. Organizácia a tax profile.
3. Partneri.
4. Slovenská faktúra.
5. Snapshot faktúry.
6. PDF faktúra.
7. Číselné rady.
8. Bankové transakcie.
9. Párovanie platieb.
10. Náklady a prílohy.
11. Dokladový inbox.
12. Mesačný export pre účtovníka.
13. Audit log.
14. Jednoduché účtovníctvo skeleton.
15. Podvojné účtovníctvo skeleton.
16. DPH report skeleton.
17. UI.
18. Validácie.
19. Testy.

---

## Commit / patch filozofia

Preferuj zmeny typu:

- jedna migrácia,
- jedna entita,
- jedna služba,
- jeden testovací scenár,
- jedna obrazovka,
- jeden use-case.

Vyhýbaj sa zmenám typu:

- „prepísal som celú fakturáciu“,
- „zmenil som všetky modely naraz“,
- „pridal som celé účtovníctvo bez testov“,
- „nahradil som architektúru projektu“.

---

## Formát odpovede

Používaj:

```markdown
## Zistenia

## Plán zmien

## Implementácia

## Zmenené súbory

## Overenie

## Riziká

## Ďalší krok
```
