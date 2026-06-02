# MASTER PROMPT PRE CODEX

Si Codex pracujúci v existujúcom repozitári. Tvojou úlohou je postupne navrhnúť a implementovať nový, čisto slovenský fakturačný a účtovný systém pre živnostníkov a s.r.o.

Systém má pokrývať:

- slovenskú fakturáciu,
- slovenské DPH režimy,
- živnostníkov,
- paušálne výdavky,
- daňovú evidenciu,
- jednoduché účtovníctvo,
- s.r.o.,
- podvojné účtovníctvo,
- bankové importy,
- párovanie platieb,
- náklady,
- dokladový inbox,
- exporty pre účtovníka,
- audit,
- uzávierky,
- bezpečnosť,
- viac firiem,
- workflow medzi podnikateľom a účtovníkom.

Cieľom nie je naraz napísať celý systém. Cieľom je postupne pripraviť architektúru, dátový model, služby, API, UI a testy tak, aby sa systém dal bezpečne rozširovať.

---

## Hlavné pravidlo práce

Nepáľ zbytočne tokeny a neprepisuj zbytočne kód.

Pri každej úlohe postupuj takto:

1. Najprv preskúmaj relevantné súbory.
2. Vypíš stručné zistenia.
3. Navrhni minimálny plán zmien.
4. Urob iba zmeny potrebné pre aktuálny krok.
5. Neprepisuj existujúce súbory celé, ak stačí malý patch.
6. Nezavádzaj veľké abstrakcie, pokiaľ nie sú potrebné pre daný krok.
7. Pri každej zmene zachovaj existujúci štýl projektu.
8. Po úprave spusti dostupné testy, typecheck, lint alebo aspoň syntax check.
9. Ak niečo nevieš overiť, jasne to uveď.
10. Nikdy nerob ďalší veľký krok, kým nie je aktuálny krok stabilný.

Vždy preferuj malé bezpečné diffy pred veľkým refactorom.

---

## Produktová veta

> Slovenský fakturačný a účtovný systém pre živnostníkov a malé s.r.o., ktorý z faktúr, nákladov a banky pripraví účtovné podklady, DPH prehľady, exporty pre účtovníka a neskôr aj kompletné jednoduché alebo podvojné účtovníctvo.

---

## Základné produktové režimy

### Živnostník

Podporované režimy:

- paušálne výdavky,
- daňová evidencia,
- jednoduché účtovníctvo.

Funkcie:

- vystavené faktúry,
- príjmy,
- výdavky,
- bankové úhrady,
- osobné výbery,
- vklady podnikateľa,
- odvody,
- prehľad príjmov,
- odhad daňovej rezervy,
- peňažný denník,
- kniha pohľadávok,
- kniha záväzkov,
- export pre účtovníka.

### s.r.o.

Podporovaný režim:

- podvojné účtovníctvo.

Funkcie:

- vystavené faktúry,
- prijaté faktúry,
- banka,
- pokladňa,
- interné doklady,
- účtový rozvrh,
- účtovný denník,
- hlavná kniha,
- pohľadávky,
- záväzky,
- DPH evidencia,
- predkontácie,
- uzávierky,
- exporty.

### Režim „mám účtovníka“

Veľa používateľov nechce účtovať v systéme, iba zbierať doklady.

Tento režim má poskytovať:

- faktúry,
- náklady,
- banku,
- dokladový inbox,
- otázky od účtovníka,
- checklist mesiaca,
- export mesiaca pre účtovníka,
- stav `ready_for_accountant`.

Účtovné funkcie môžu byť skryté, ale dáta musia byť pripravené na účtovné spracovanie.

---

## Definícia úspechu MVP 1.0

MVP 1.0 je hotové, keď:

1. Používateľ vytvorí slovenskú firmu.
2. Nastaví IČO, DIČ, IČ DPH, IBAN, BIC.
3. Vytvorí klienta.
4. Vystaví slovenskú faktúru.
5. Faktúra dostane správne číslo.
6. Vznikne snapshot.
7. Vznikne PDF s hashom.
8. PDF obsahuje slovenské povinné údaje.
9. Faktúra má SEPA QR platbu.
10. Používateľ importuje bankové transakcie.
11. Systém navrhne párovanie platby podľa VS/sumy/IBAN.
12. Používateľ potvrdí párovanie.
13. Faktúra sa označí ako uhradená.
14. Používateľ nahrá náklad s prílohou.
15. Náklad sa objaví v inboxe.
16. Používateľ pripraví mesačný export pre účtovníka.
17. Export obsahuje faktúry, náklady, banku, manifest a hash.
18. Všetky kľúčové akcie sú v audit logu.
19. Testy pre výpočty, číslovanie a párovanie prechádzajú.

---

## Výstup pri každom kroku

Odpovedaj vždy štruktúrovane:

```markdown
## Zistenia

...

## Plán zmien

...

## Zmenené súbory

...

## Testy / overenie

...

## Riziká / ďalší krok

...
```

Ak niečo nie je možné urobiť bez ďalších informácií, nepokračuj naslepo. Navrhni 2–3 bezpečné možnosti.
