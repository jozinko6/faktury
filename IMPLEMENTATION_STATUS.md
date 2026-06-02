# Stav implementácie

## Aktuálny stav repozitára

- Repozitár zatiaľ neobsahuje Git metadata.
- V pracovnom adresári je rozbalená Markdown dokumentácia v `codex_markdown_plan/` a prvý minimálny Next.js runtime skeleton.
- PDF generovanie, bankové importy, auth, produkčná databáza a reálne MVP služby zatiaľ neexistujú.

## Roadmapa

- Krok 1 - Analýza existujúceho repozitára: dokončené pre aktuálny stav.
- Krok 2 - Slovenské konfiguračné jadro: čiastočne dokončené ako stackovo neutrálny JSON config.
- Krok 3 - Organizácia a tax profile: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 4 - Partneri: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Produktový MVP 1.0 backlog: spísaný podľa `komplet.md` a priloženého promptu.
- Krok 5 - Fakturačný základ: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 6 - Číselné rady: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 7 - Snapshot faktúry: čiastočne dokončené v `domain/invoice.schema.json`.
- Krok 8 - Slovenské PDF: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 9 - Email odoslanie faktúry: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 10 - Bankové transakcie: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 11 - Párovanie platieb: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 12 - Náklady a prijaté faktúry: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 13 - Dokladový inbox: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 14 - Mesačné obdobie a checklist: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 15 - Export pre účtovníka: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 16 - Audit log: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 17 - DPH report skeleton: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 18 - Jednoduché účtovníctvo skeleton: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 19 - Podvojné účtovníctvo skeleton: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 20 - UI vrstvy: čiastočne dokončené ako stackovo neutrálna UI mapa.
- Krok 21 - Validácie: čiastočne dokončené ako stackovo neutrálna JSON Schema.
- Krok 22 - Testy: čiastočne dokončené ako PowerShell kontraktový test harness s MVP fixtures.
- Najbližší nedokončený krok: Runtime MVP bootstrap pred ďalším refactorom.

## Implementované konfiguračné jadro

Súbor `config/slovakia-core.json` obsahuje:

- default menou `EUR`,
- krajinu `SK`,
- základné validačné vzory pre IČO, DIČ a IČ DPH,
- IBAN/BIC ako primárny bankový model,
- slovenské DPH sadzby `SK-23`, `SK-19`, `SK-5`, `SK-0`, `SK-RC`,
- DPH režimy a treatmenty,
- slovenské texty faktúry,
- základné slovenské UI pojmy,
- návrh číselných rád pre faktúry a dobropisy.

## Odporúčaný minimálny ďalší patch

Pre Krok 23 nerobiť refactor, kým MVP flow nemá runtime implementáciu. Stack pre prvý runtime MVP slice je zaznamenaný v `docs/STACK_DECISION.md`; najbližší bezpečný krok je pokračovať v Kroku 10 malým generic CSV importom bankových transakcií nad už pridaným runtime skeletonom.

## Rozhodnutý runtime stack

Súbor `docs/STACK_DECISION.md` odporúča pre MVP runtime Next.js App Router, TypeScript, lokálne SQLite a Prisma migrácie. Rozhodnutie je zámerne obmedzené na prvý lokálny MVP slice: organizácia, partner, draft faktúra, položky faktúry a audit event. Auth, produkčná databáza, PDF generovanie, bankové API a exporty ostávajú mimo prvého bootstrap patchu.

## Implementovaný runtime bootstrap

Pridaný je minimálny Next.js + TypeScript skeleton, Prisma SQLite schéma a seed skript, ktorý mapuje existujúce fixtures na runtime modely `Organization`, `BusinessPartner`, `Invoice`, `InvoiceItem` a `AuditEvent`. Úvodná obrazovka zobrazuje iba prehľad fixture dát a chráni pravidlo, že draft faktúra ešte nemá číslo. Keďže `prisma db push` na tomto Windows prostredí padá cez schema engine bez detailu, lokálny bootstrap má aj idempotentný SQL fallback `npm run db:bootstrap`.

## Implementovaná runtime operácia draft faktúry

Funkcia `createDraftInvoice` vytvára draft faktúru v transakcii, overí že zákazník patrí pod organizáciu, vypočíta položky, DPH a zostatok, uloží položky a audit event `invoice_draft_created`. Zámerne nepriraďuje číslo faktúry, variabilný symbol ani issue snapshot.

## Implementovaný API povrch pre draft faktúru

Endpoint `POST /api/invoices/drafts` prijíma minimálne dáta draft faktúry, volá `createDraftInvoice` a vracia vytvorenú faktúru so stavom, sumami a počtom položiek. Endpoint zámerne nepriraďuje číslo faktúry a pri partnerovi mimo organizácie vracia chybu.

## Implementovaný minimálny UI povrch draft faktúry

Úvodná stránka obsahuje client-side panel `CreateDraftInvoicePanel`, ktorý zavolá `POST /api/invoices/drafts`, zobrazí výsledok a explicitne ukáže, že nová draft faktúra má číslo stále `null`/nepridelené.

## Implementovaný runtime zoznam draft faktúr

Endpoint `GET /api/invoices/drafts?organizationId=...` vracia posledné uložené draft faktúry pre organizáciu. UI panel si zoznam načíta pri otvorení stránky a obnoví ho po vytvorení draftu, aby bolo vidno, že faktúry sú reálne uložené v SQLite databáze a stále nemajú pridelené číslo.

## Implementovaná runtime operácia vystavenia faktúry bez PDF

Funkcia `issueInvoice` atomicky načíta draft faktúru, nájde aktívnu fakturačnú číselnú radu `FV{YYYY}{NNNN}`, pridelí číslo až pri vystavení, nastaví variabilný symbol, uloží základný `issueSnapshotJson`, posunie `nextNumber` a zapíše audit event `invoice_issued`. PDF generovanie ešte nie je súčasťou tohto kroku.

## Implementovaný API povrch pre vystavenie faktúry

Endpoint `POST /api/invoices/[invoiceId]/issue` prijíma `organizationId`, volá `issueInvoice` a vracia vystavenú faktúru s číslom, variabilným symbolom a príznakom vytvoreného snapshotu. Endpoint stále negeneruje PDF.

## Implementovaný minimálny UI povrch vystavenia faktúry

Zoznam runtime draft faktúr v `CreateDraftInvoicePanel` má akciu `Vystavit`, ktorá volá `POST /api/invoices/[invoiceId]/issue`. Po úspešnom vystavení panel zobrazí pridelené číslo, variabilný symbol a snapshot a obnoví zoznam draftov, takže vystavená faktúra zo zoznamu draftov zmizne.

## Implementovaný runtime PDF metadata/hash kontrakt

Model `InvoicePdfVersion` a funkcia `createInvoicePdfMetadata` ukladajú metadata-only PDF verziu pre vystavenú faktúru. Funkcia vyžaduje `issued` faktúru so snapshotom, vypočíta `snapshotHash`, metadata-only `pdfHash`, uloží `fileId`, `templateVersion`, `renderVersion`, `status = draft_render` a `reason = issue`. Reálne PDF bajty ani renderovanie sa ešte nevytvárajú.

## Implementovaný API povrch pre PDF metadata/hash

Endpoint `POST /api/invoices/[invoiceId]/pdf-metadata` prijíma `organizationId`, volá `createInvoicePdfMetadata` a vracia metadata-only PDF verziu s `pdfHash`, `snapshotHash`, `fileId`, `templateVersion`, `renderVersion` a `metadataOnly = true`. Endpoint stále negeneruje PDF súbor.

## Implementovaný minimálny UI povrch pre PDF metadata/hash

Po vystavení faktúry vie `CreateDraftInvoicePanel` zavolať `POST /api/invoices/[invoiceId]/pdf-metadata` cez akciu `Pripravit PDF metadata`. UI zobrazí verziu, stav `draft_render`, `metadataOnly = true` a skrátené `snapshotHash`/`pdfHash`. PDF súbor sa stále negeneruje.

## Implementovaný list API pre PDF metadata/hash

Endpoint `GET /api/invoices/[invoiceId]/pdf-metadata?organizationId=...` vracia všetky uložené PDF metadata verzie faktúry v rámci organizácie, zoradené od najnovšej verzie. Endpoint overuje, že faktúra patrí do organizácie, a vracia iba metadata, nie PDF súbor.

## Implementovaný minimálny UI zoznam PDF metadata verzií

Po vystavení faktúry panel načíta `GET /api/invoices/[invoiceId]/pdf-metadata?organizationId=...` a zobrazí uložené PDF metadata verzie. Po akcii `Pripravit PDF metadata` sa zoznam obnoví a ukáže verziu, stav, metadata-only režim a skrátený `pdfHash`.

## Implementovaný šablónový textový render faktúry

Funkcia `renderInvoiceText` vytvára deterministický textový náhľad slovenskej faktúry z `issueSnapshotJson`. Endpoint `POST /api/invoices/[invoiceId]/pdf-metadata` vracia tento `textPreview` spolu s metadata-only PDF verziou, ale stále nevytvára ani neukladá PDF súbor.

## Implementovaný HTML preview render faktúry

Funkcia `renderInvoiceHtmlPreview` vytvára samostatný HTML náhľad faktúry zo snapshotu a escapuje hodnoty zo snapshotu pred vložením do HTML. Endpoint `POST /api/invoices/[invoiceId]/pdf-metadata` vracia aj `htmlPreview` a UI ho po príprave PDF metadata zobrazí v izolovanom iframe náhľade. PDF súbor sa stále negeneruje.

## Implementovaný minimálny PDF render artefaktu

Funkcia `renderInvoicePdf` vytvára minimálny validný PDF buffer z textového snapshot renderu bez pridania externej PDF knižnice. Funkcia `createInvoicePdfRender` uloží nový `InvoicePdfVersion` so `metadataOnly = false`, `status = rendered`, `renderVersion = minimal-pdf-v1`, vypočíta `pdfHash` zo skutočných PDF bajtov a uloží lokálny artefakt do `storage/invoice-pdfs/{fileId}.pdf`. Endpoint `POST /api/invoices/[invoiceId]/pdf-render` renderuje iba vystavenú faktúru so snapshotom a nemení staršie PDF verzie.

## Implementovaná minimálna UI akcia PDF renderu

Po vystavení faktúry vie `CreateDraftInvoicePanel` zavolať `POST /api/invoices/[invoiceId]/pdf-render` cez akciu `Renderovat PDF`. UI zobrazí verziu, stav `rendered`, `metadataOnly = false`, veľkosť artefaktu a skrátený `pdfHash`, potom obnoví zoznam PDF verzií.

## Implementovaný download endpoint PDF artefaktu

Endpoint `GET /api/invoices/[invoiceId]/pdf-render/[fileId]?organizationId=...` overí, že renderovaná PDF verzia patrí faktúre a organizácii, nie je metadata-only, má stav `rendered`, lokálny súbor existuje a jeho SHA-256 hash zodpovedá uloženému `pdfHash`. Pri úspechu vráti `application/pdf` s prílohovým názvom podľa čísla faktúry a hlavičkou `x-invoice-pdf-hash`.

## Implementovaný UI odkaz na stiahnutie PDF

Po úspešnom minimálnom PDF renderi UI zobrazí odkaz `Stiahnut PDF`, ktorý smeruje na download endpoint s `invoiceId`, `fileId` a `organizationId`. Rovnaký odkaz sa zobrazuje aj v zozname PDF verzií pre renderované non-metadata verzie.

## Implementovaný audit event pre PDF render

Funkcia `createInvoicePdfRender` pri vytvorení renderovanej PDF verzie zapisuje audit event `invoice_pdf_rendered` na entitu faktúry. Audit payload obsahuje `pdfVersionId`, `version`, `fileId`, `pdfHash`, `snapshotHash`, `templateVersion` a `renderVersion`.

## Implementovaný runtime email outbox model a služba

Pridané sú runtime modely `InvoiceEmailEvent`, `EmailJob` a `EmailLog`. Funkcia `createInvoiceEmailOutbox` vytvorí outbox event, queued email job a queued email log pre vystavenú faktúru s renderovanou PDF verziou. Email sa stále reálne neodosiela; služba iba pripraví odosielací job s príjemcami, predmetom, textovým snapshotom a `attachmentFileIdsJson`.

## Implementovaný API endpoint email outboxu

Endpoint `POST /api/invoices/[invoiceId]/email-outbox` prijíma `organizationId`, `pdfVersionId` a pole príjemcov `to`. Volá `createInvoiceEmailOutbox` a vracia vytvorený event, queued email job a queued email log bez reálneho odoslania emailu.

## Implementovaná minimálna UI akcia email outboxu

Po minimálnom PDF renderi vie `CreateDraftInvoicePanel` zavolať `POST /api/invoices/[invoiceId]/email-outbox` cez akciu `Pripravit email outbox`. UI zobrazí stav queued email jobu, queued logu, šablónu, príjemcu a počet PDF príloh. Email sa stále reálne neodosiela.

## Implementovaný list API endpoint email outboxu

Endpoint `GET /api/invoices/[invoiceId]/email-outbox?organizationId=...` overí faktúru v organizácii a vráti email outbox joby zoradené od najnovších. Každý job obsahuje status, šablónu, príjemcov, prílohy a posledný log.

## Implementovaný UI zoznam email outbox jobov

Po vystavení faktúry `CreateDraftInvoicePanel` načíta email outbox joby cez `GET /api/invoices/[invoiceId]/email-outbox?organizationId=...`. Po akcii `Pripravit email outbox` sa zoznam obnoví a zobrazí status jobu, status posledného logu, šablónu a prvého príjemcu.

## Implementovaný audit event pre email outbox

Funkcia `createInvoiceEmailOutbox` pri založení queued email jobu zapisuje audit event `invoice_email_outbox_queued` na entitu faktúry. Audit payload obsahuje `emailEventId`, `emailJobId`, `emailLogId`, `pdfVersionId`, `templateCode`, `status` a zoznam príjemcov.

## Implementovaný skeleton email workeru

Funkcia `processNextInvoiceEmailJob` nájde najstarší queued email job pre organizáciu, bez reálneho odoslania ho označí ako `sent_simulated`, zvýši `attemptCount`, nastaví `processedAt`, zapíše nový `EmailLog` so stavom `sent_simulated` a audit event `invoice_email_sent_simulated`.

## Implementovaný API endpoint simulovaného email workeru

Endpoint `POST /api/email-worker/simulate` prijíma `organizationId` a voliteľné `invoiceId`, zavolá `processNextInvoiceEmailJob` a vráti spracovaný job/log so stavom `sent_simulated`. Endpoint je určený len na MVP simuláciu a nič reálne neodosiela.

## Implementovaný runtime skeleton bankových transakcií

Pridané sú runtime modely `BankAccount`, `BankStatementImport` a `BankTransaction` s väzbou na organizáciu, bankový účet, import výpisu, `fileHash`, `importHash` a `transactionHash`. Overovací skript vytvorí jeden bankový účet, CSV import skeleton a jednu novú transakciu bez párovania platieb.

## Implementovaný generic CSV import bankových transakcií

Funkcia `importGenericBankCsv` prijíma jednoduchý hlavičkový CSV text, overí bankový účet v organizácii, vypočíta `fileHash` a `importHash`, uloží `BankStatementImport` a vytvorí nové `BankTransaction` z riadkov CSV. Opakovaný import rovnakého súboru je rozpoznaný podľa `importHash`; duplicitné transakcie sa neukladajú znova. Párovanie platieb stále nie je súčasťou kroku.

## Implementovaný API endpoint pre bankový CSV import

Endpoint `POST /api/banking/imports/csv` prijíma `organizationId`, `bankAccountId`, `sourceFileName`, `csvContent` a `importedBy`, volá `importGenericBankCsv` a vracia uložený import, počty nových/duplicitných transakcií a základný zoznam transakcií. Prvý import vracia `201`, opakovaný import rovnakého súboru vracia `200` s `duplicateImport = true`.

## Implementovaný list API endpoint pre bankové importy

Endpoint `GET /api/banking/imports?organizationId=...` vracia posledné bankové importy v organizácii spolu so základnými údajmi bankového účtu a najnovšími transakciami. Voliteľný filter `bankAccountId` obmedzí výsledky na jeden účet. Endpoint je čítací a stále nerobí párovanie platieb.

## Implementovaný minimálny UI povrch bankových importov

Úvodná stránka obsahuje panel `BankImportPanel`, ktorý používa seednutý MVP bankový účet, vie zavolať `POST /api/banking/imports/csv` s testovacím CSV a načítať výsledky cez `GET /api/banking/imports`. UI zobrazuje importy, stav, parser typ, počet nových transakcií a základné riadky bankových transakcií. Párovanie platieb ešte nie je implementované.

## Implementovaný fakturačný základ

Súbor `domain/invoice.schema.json` obsahuje draft faktúru bez povinného čísla, typy a stavy faktúr, položky, dátumy, DPH sadzbu aj DPH treatment na položke, výpočtové polia a snapshot pri vystavení.

## Implementované číselné rady

Súbor `domain/number-series.schema.json` obsahuje číselnú radu, počítadlo a rezerváciu čísla. Rezervácia má audit event, statusy `reserved`, `issued`, `voided`, `failed_reserved` a pravidlo `assignOn = issue`.

## Implementovaný snapshot faktúry

`domain/invoice.schema.json` obsahuje typovaný `issueSnapshot` pre dodávateľa, odberateľa, banku, DPH, položky, výpočty a texty. Snapshot je pripravený na reprodukovateľné PDF a audit, ale PDF generovanie zatiaľ nie je implementované.

## Implementovaný PDF kontrakt

`domain/invoice-pdf.schema.json` obsahuje PDF verziu faktúry, `fileId`, `pdfHash`, `snapshotHash`, verzie šablóny/renderu, povinné slovenské PDF údaje a SEPA QR platobné dáta. Samotný render PDF zatiaľ nie je implementovaný.

## Implementovaný email outbox

`domain/invoice-email-outbox.schema.json` obsahuje event `invoiceIssuedEvent`, email job, email log a šablónu emailu. Model zachováva outbox pattern: email sa neodosiela priamo počas vystavenia faktúry.

## Implementované bankové transakcie

`domain/banking.schema.json` obsahuje bankový účet, import výpisu, parser typy, `fileHash`, `importHash`, bankové transakcie, `transactionHash` a stavy transakcie. Párovanie platieb zatiaľ nie je implementované.

## Implementované párovanie platieb

`domain/payment-matching.schema.json` obsahuje matching candidate, confidence score, match decision, payments, payment allocations a odvodený invoice balance/status. Reálny matching engine zatiaľ nie je implementovaný.

## Implementované náklady a prijaté faktúry

`domain/expenses.schema.json` obsahuje prijaté faktúry, výdavky, položky, prílohy cez `fileId`, kategórie, daňovú uznateľnosť, zmiešané náklady, billable expenses a voliteľnú väzbu na bankovú transakciu.

## Implementovaný dokladový inbox

`domain/document-inbox.schema.json` obsahuje inbox item, document, document files, document links, comments a questions. Model rozlišuje dokument bez účtovného dopadu od business/accounting dokumentu a nepovoľuje automatické zaúčtovanie OCR výsledku ako pravidlo správania.

## Implementované mesačné obdobie

`domain/monthly-period.schema.json` obsahuje mesačné obdobie, stav `ready_for_accountant`, export status, checklist pre podnikateľa/účtovníka, otázky k obdobiu a prehľad chýbajúcich dokladov s `blockingCount`.

## Implementovaný export pre účtovníka

`domain/accountant-export.schema.json` obsahuje export package, ZIP `fileId`, `zipHash`, `manifestHash`, manifest, zoznam súborov, zoznam zahrnutých dokladov, hashes a audit summary. Reálne generovanie ZIP/XLSX/CSV zatiaľ nie je implementované.

## Implementovaný audit log

`domain/audit-log.schema.json` obsahuje audit entry pre faktúru vystavenú/odoslanú, platbu spárovanú/odpárovanú, náklad schválený, export vytvorený, zmenu IBAN a zámky obdobia. Obsahuje old/new value, IP, user-agent, dôvod a hash chain polia `previousHash`/`currentHash`.

## Implementovaný DPH report skeleton

`domain/vat-report.schema.json` obsahuje DPH obdobie, VAT entries, DPH sumarizáciu vstupnej/výstupnej DPH, reverse charge a XLSX/CSV export. XML podania nie sú implementované.

## Implementované jednoduché účtovníctvo

`domain/simple-accounting.schema.json` obsahuje peňažný denník, pohľadávky, záväzky, jednoduché účtovné kategórie a income/expense record skeleton. Neobsahuje podvojné journal entries.

## Implementované podvojné účtovníctvo

`domain/double-entry-accounting.schema.json` obsahuje neaktívny skeleton pre účtový rozvrh, journal entries, journal entry lines, posting rules a draft postings. `isPrimaryAccounting` je nastavené na `false`, kým PÚ nebude stabilné.

## Implementovaná UI mapa

`docs/UI_SCREEN_MAP.md` definuje podnikateľský a účtovnícky pohľad, MVP navigáciu, obrazovky dashboardu, faktúr, partnerov, banky, nákladov, inboxu, mesačného checklistu a exportu pre účtovníka. Frontend stack zatiaľ nie je zvolený.

## Implementované validácie

`domain/validation.schema.json` obsahuje kontrakt validačného enginu: validation rule, context, result, severity `error/warning/info` a pravidlá pre IBAN, faktúry, DPH, číselné rady, zamknuté obdobia a chýbajúce doklady.

## Implementované testy

`tests/validate-contracts.ps1` parsuje všetky JSON kontrakty a fixtures a overuje základné MVP invarianty pre slovenské jadro, faktúry, číselné rady, DPH, bankový import, párovanie, export, audit, validácie, neaktívne PÚ a základné väzby organizácia -> partner -> draft faktúra.

## Aktuálny produktový rozsah

Súbor `docs/MVP_1_BACKLOG.md` definuje, čo patrí do MVP 1.0 a čo je vedome mimo MVP. Tento backlog má prednosť pri rozhodovaní, či je ďalší nápad súčasťou prvej verzie alebo neskoršej roadmapy.

## Referenčné poznámky z `radekhulan/myinvoice`

Ako inšpirácia boli použité iba doménové vzory:

- multi-supplier model mapovaný na naše `organizations`,
- oddelenie firmy od daňového profilu,
- partner ako jedna entita s rolami klient/dodávateľ,
- IBAN/BIC pre EUR účty,
- historizované daňové nastavenia.

Zámerne sa nepreberajú české defaulty a CZ-specific vrstvy ako ARES-first model, Pohoda/EPO XML, české bankové formáty alebo CZ DPH sadzby.
