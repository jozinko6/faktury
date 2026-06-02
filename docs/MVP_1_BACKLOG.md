# MVP 1.0 backlog

Tento backlog prekladá aktuálnu produktovo-technickú špecifikáciu do rozsahu prvej verzie. Cieľom MVP 1.0 nie je kompletné účtovníctvo, ale bezpečný tok dokladov od faktúry cez banku a náklady po mesačný balík pre účtovníka.

## Cieľ MVP 1.0

Slovenský podnikateľ vie:

1. založiť slovenskú organizáciu,
2. nastaviť IČO, DIČ, IČ DPH, IBAN a BIC,
3. založiť klienta alebo dodávateľa,
4. vystaviť slovenskú faktúru,
5. nahrať náklady a prílohy,
6. importovať bankové transakcie,
7. potvrdiť párovanie úhrad,
8. pripraviť mesačný export pre účtovníka,
9. spätne overiť kľúčové akcie cez audit log.

## Musí byť v MVP

### Slovenské jadro

- EUR ako defaultná mena.
- Slovensko ako primárna krajina.
- IČO, DIČ, IČ DPH, IBAN a BIC.
- Slovenské DPH sadzby a DPH režimy.
- Slovenské fakturačné texty.
- Žiadne české defaulty ako primárny model.

### Organizácia a daňový profil

- Organizácia s právnou formou `sole_trader` alebo `sro`.
- Daňový profil s platnosťou `valid_from` a `valid_to`.
- Režimy `flat_expenses`, `tax_evidence`, `simple_accounting`, `double_entry`.
- DPH režimy `non_payer`, `payer`, `section_7`, `section_7a`.
- Možnosť meniť režim v čase.

### Partneri

- Jednotný business partner pre klienta aj dodávateľa.
- Roly `customer`, `supplier`, `both`.
- Adresy, kontakty, daňové ID a bankové účty.
- Snapshot partnera do dokladov.

### Faktúry

- Draft faktúra bez čísla.
- Položky faktúry.
- DPH režim na položke, nielen percento DPH.
- Výpočty základ, DPH, celkom a zostávajúci zostatok.
- Vystavenie ako samostatná operácia.
- Číslo prideliť až pri vystavení.
- Snapshot dodávateľa, odberateľa, banky, položiek, DPH a výpočtov.
- Stav faktúry: `draft`, `issued`, `sent`, `partially_paid`, `paid`, `overdue`, `cancelled`.

### PDF faktúra

- Slovenské povinné údaje.
- IBAN, BIC a variabilný symbol.
- SEPA QR platba.
- Uložený PDF hash.
- Staré PDF po vystavení nemeniť.

### Banka a párovanie

- Bankové účty organizácie.
- Bankové transakcie.
- CSV import ako prvý importný formát.
- Idempotency hash importu a transakcie.
- Matching candidates podľa VS, sumy a IBAN.
- Match decision potvrdený používateľom.
- Payment allocations namiesto samotného `invoice.paid_at`.
- Stav faktúry odvodiť zo zostatku.

### Náklady a inbox

- Prijatá faktúra alebo výdavok.
- Prílohy cez file ID, nie iba cestu.
- Document inbox s workflow `new`, `recognized`, `reviewed`, `approved`, `posted`, `archived`.
- Rozlišovať `Document`, `BusinessDocument` a `AccountingDocument`.
- Proforma, cenová ponuka a scan bez potvrdenia nesmú automaticky vstupovať do DPH alebo účtovníctva.

### Mesačný workflow pre účtovníka

- Mesačné obdobie.
- Checklist chýbajúcich dokladov.
- Stav `ready_for_accountant`.
- Export ZIP s faktúrami, nákladmi, bankou, manifestom a hashmi.

### Audit a integrita

- Audit log pre vystavenie faktúry, odoslanie, zmenu IBAN, párovanie platby, schválenie nákladu a export.
- Audit záznam má obsahovať organizáciu, entitu, používateľa, čas, akciu a zmenu.
- PDF a exportné manifesty majú mať hash.

### Testy

- Výpočty faktúr.
- DPH sadzby a DPH režimy.
- Číselné rady bez čísla pri drafte.
- Párovanie bankových transakcií.
- Payment allocations.
- Tenant isolation.
- Golden text test PDF povinných polí.

## Vedome mimo MVP

- XML daňové podania.
- eKasa.
- Mzdy.
- Sklad.
- PSD2 bankové API.
- Platobné brány.
- OCR ako povinná súčasť.
- Automatické zaúčtovanie bez potvrdenia účtovníkom.
- Plné podvojné účtovníctvo ako hlavný režim.
- Certifikačný program účtovníkov.
- Marketplace účtovníkov.
- Field-level permissions.
- Antivírus scan príloh.
- Verejný overovač hashov.
- Kalendár a notifikačný engine.
- Email bounce handling.
- Fulltext v prílohách.

## Architektonické pravidlá pre MVP

- Každá dôležitá zmena režimu alebo bankového účtu musí mať dátumovú platnosť.
- Draft faktúra nemá číslo.
- Dokladové číslo nikdy nesmie byť databázové ID.
- Entity používajú UUID alebo ULID.
- Vystavenie faktúry má byť atomická operácia.
- Email a webhook odosielanie má ísť cez outbox pattern.
- Staré vystavené PDF sa neregeneruje novou šablónou.
- Reporty môžu čítať normalizované dáta, ale PDF a audit musia byť reprodukovateľné zo snapshotu.
- Query scoping podľa organizácie musí byť centrálne vynútiteľný.

## Najbližší implementačný krok

Pokračovať podľa pôvodnej roadmapy Krokom 5:

- prečítať `06_INVOICING.md`,
- založiť minimálnu schému faktúry,
- zachovať draft bez čísla,
- pripraviť položky, dátumy, DPH treatment, výpočtové polia a stav faktúry,
- ešte nerobiť PDF, číselné rady ani emaily.
