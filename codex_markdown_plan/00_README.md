# Slovenský fakturačný a účtovný systém — dokumentácia pre Codex

Tento priečinok obsahuje rozdelený master prompt a technicko-produktovú špecifikáciu pre Codex.

Cieľom je vybudovať nový alebo transformovať existujúci projekt na **čisto slovenský fakturačný a účtovný systém** pre:

- živnostníkov,
- paušálne výdavky,
- daňovú evidenciu,
- jednoduché účtovníctvo,
- s.r.o.,
- podvojné účtovníctvo,
- spoluprácu s účtovníkom,
- bankové párovanie,
- dokladový inbox,
- export mesačných balíkov pre účtovníka.

## Ako tieto súbory používať v Codexe

Odporúčaný postup:

1. Najprv vlož Codexu obsah súboru `01_MASTER_CODEX_PROMPT.md`.
2. Potom vlož `02_CODEX_OPERATING_RULES.md`, aby sa držal postupnosti.
3. Pri implementácii mu dávaj vždy len relevantný modul:
   - faktúry → `06_INVOICING.md`
   - banka → `07_BANKING_AND_MATCHING.md`
   - náklady/inbox → `08_DOCUMENT_INBOX_AND_EXPENSES.md`
   - účtovníctvo → `09_ACCOUNTING_ENGINE.md`
4. Pred každou novou session mu vlož `15_SESSION_START_PROMPTS.md`.

## Hlavný princíp

Codex nesmie robiť celý systém naraz. Musí postupovať inkrementálne:

- analyzovať,
- navrhnúť malý krok,
- spraviť malý patch,
- spustiť testy,
- vypísať ďalší krok.

## Najbližšia praktická priorita

MVP 1.0:

> Slovenský podnikateľ vie vystaviť faktúru, nahrať náklady, importovať banku, spárovať platby a poslať účtovníkovi kompletný mesačný balík.

## Súbory

- `01_MASTER_CODEX_PROMPT.md` — hlavný prompt pre Codex.
- `02_CODEX_OPERATING_RULES.md` — pravidlá práce, šetrenie tokenov, zákaz veľkých refactorov.
- `03_PRODUCT_VISION_AND_MVP.md` — produktová vízia a fázy vývoja.
- `04_DOMAIN_MODEL.md` — doménový a databázový model.
- `05_SLOVAK_LOCALIZATION_TAX_VAT.md` — slovenské údaje, DPH, IBAN, IČO/DIČ/IČ DPH.
- `06_INVOICING.md` — faktúry, PDF, číselné rady, QR platby.
- `07_BANKING_AND_MATCHING.md` — bankové transakcie, importy, párovanie.
- `08_DOCUMENT_INBOX_AND_EXPENSES.md` — dokladový inbox, prijaté faktúry, náklady.
- `09_ACCOUNTING_ENGINE.md` — jednoduché a podvojné účtovníctvo.
- `10_ACCOUNTANT_WORKFLOW_AND_EXPORTS.md` — mesačný workflow a export pre účtovníka.
- `11_SECURITY_AUDIT_AND_INTEGRITY.md` — bezpečnosť, audit, integrita dokladov.
- `12_UI_VALIDATION_AUTOMATION.md` — UI, validačný engine a automatizácie.
- `13_TESTING_AND_QA.md` — testovacie scenáre a kvalita.
- `14_IMPLEMENTATION_SEQUENCE.md` — presná postupnosť krokov pre Codex.
- `15_SESSION_START_PROMPTS.md` — krátke prompty pre jednotlivé session.
