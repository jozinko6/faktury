# UI mapa obrazoviek

Táto mapa definuje prvú UI vrstvu bez viazania na konkrétny frontend stack. Slúži ako podklad pre neskoršiu implementáciu obrazoviek, navigácie a validácií.

## Pohľady aplikácie

### Podnikateľský pohľad

Priorita je ukázať používateľovi, čo má urobiť dnes:

- vystaviť alebo odoslať faktúru,
- skontrolovať neuhradené faktúry,
- doplniť doklad k platbe,
- potvrdiť navrhnuté párovanie,
- schváliť náklad,
- pripraviť mesiac pre účtovníka.

### Účtovnícky pohľad

Priorita je kontrola, spracovanie a export:

- DPH evidencia,
- otázky k dokladom,
- mesačný checklist,
- kontrola banky,
- export podkladov,
- účtovné skeletony JÚ/PÚ.

## MVP navigácia

### Dashboard

Účel: okamžite ukázať stav firmy a najbližšie úlohy.

Widgety:

- Dnes treba riešiť,
- neuhradené faktúry,
- záväzky tento týždeň,
- chýbajúce doklady,
- navrhnuté párovania,
- DPH odhad,
- mesačný checklist,
- bezpečný zostatok.

### Faktúry

Účel: vytvoriť, vystaviť, odoslať a sledovať úhrady faktúr.

MVP obrazovky:

- zoznam faktúr,
- detail faktúry,
- jednoduchá faktúra,
- pokročilá faktúra,
- PDF a odoslanie,
- stav úhrad.

Kľúčové pravidlá:

- draft nemá číslo,
- číslo vzniká až pri vystavení,
- odoslaná faktúra sa nemení bez opravy,
- stav úhrady vychádza z alokácií.

### Partneri

Účel: spravovať klientov a dodávateľov v jednom modeli.

MVP obrazovky:

- zoznam partnerov,
- detail partnera,
- nový partner,
- bankové účty partnera,
- daňové údaje partnera.

Kľúčové pravidlá:

- partner môže byť `customer`, `supplier` alebo `both`,
- zmena IBAN je citlivá a auditovaná.

### Banka

Účel: importovať transakcie a pripraviť ich na párovanie.

MVP obrazovky:

- bankové účty,
- import výpisu,
- zoznam transakcií,
- transakcie bez dokladu,
- návrhy párovania.

Kľúčové pravidlá:

- import musí byť idempotentný,
- transakcia má hash,
- nízka istota párovania je iba návrh.

### Náklady

Účel: evidovať prijaté faktúry, bločky a výdavky.

MVP obrazovky:

- zoznam nákladov,
- prijatá faktúra,
- výdavok,
- prílohy,
- kategória a daňová uznateľnosť,
- náklady na schválenie.

Kľúčové pravidlá:

- náklad bez prílohy je problém pred exportom,
- OCR alebo rozpoznanie nikdy samo nezaúčtuje doklad,
- zmiešané náklady majú podnikateľské a súkromné percento.

### Inbox

Účel: spracovať nespracované dokumenty a otázky.

MVP obrazovky:

- inbox položky,
- detail dokumentu,
- komentáre,
- otázky,
- prepojenie na faktúru, náklad alebo banku.

Kľúčové pravidlá:

- nie každý dokument má účtovný dopad,
- otázky majú stav `needs_info`, `answered`, `approved`, `resolved`.

### Mesačný Checklist

Účel: pripraviť mesiac pre účtovníka.

MVP obrazovky:

- obdobie mesiaca,
- checklist podnikateľa,
- checklist účtovníka,
- chýbajúce doklady,
- otázky k obdobiu,
- akcia `ready_for_accountant`.

Kľúčové pravidlá:

- `blockingCount` musí byť 0 pred odovzdaním účtovníkovi,
- zamknutý mesiac sa nemení bez dôvodu a auditu.

### Export Pre Účtovníka

Účel: vytvoriť mesačný balík podkladov.

MVP obrazovky:

- príprava exportu,
- kontrola obsahu,
- exportný manifest,
- hashe,
- história exportov.

Kľúčové pravidlá:

- export obsahuje manifest,
- ZIP aj manifest majú hash,
- zmeny dokladov po exporte musia byť viditeľné.

## Neskoršie UI

Tieto obrazovky nepatria do prvého UI rezu:

- plné podvojné účtovníctvo,
- účtový rozvrh ako produkčný modul,
- XML daňové podania,
- OCR workflow ako povinný krok,
- marketplace účtovníkov,
- field-level permission editor,
- notifikačný engine.

## Najbližší UI implementačný krok

Pred kódovaním UI treba zvoliť aplikačný stack. Bezpečná východisková možnosť pre ďalší patch je:

- Next.js alebo React/Vite frontend,
- API vrstva podľa zvoleného backendu,
- JSON Schema kontrakty použiť ako základ validačných typov,
- prvá obrazovka: dashboard s úlohami a stavom mesiaca.
