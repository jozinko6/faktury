Áno — tu sú ďalšie, už skôr „produktovo-technické“ návrhy, ktoré by som dal do neskoršej špecifikácie.



301\. Oddelenie „doklad“ vs. „účtovný doklad“



V systéme by som rozlišoval:



Document

\- PDF, scan, email, príloha, zmluva, faktúra, bloček



BusinessDocument

\- vystavená faktúra

\- prijatá faktúra

\- pokladničný doklad

\- interný doklad



AccountingDocument

\- účtovný prípad, ktorý vstupuje do účtovníctva



Nie každý upload je hneď účtovný doklad. Najprv môže byť len súbor v inboxe.



302\. Stav „účtovne neúčinné“



Niektoré veci sú evidované, ale nemajú účtovný dopad.



Príklady:



\- cenová ponuka

\- objednávka

\- proforma / výzva na úhradu

\- interná poznámka

\- zmluva

\- scan bez potvrdenia



Toto zabráni tomu, aby systém omylom zahrnul proformu do účtovníctva alebo DPH.



303\. Typy dátumov ako samostatný model



Namiesto rozhádzaných polí by som mal jasnú dátumovú vrstvu:



document\_date        dátum dokladu

issue\_date           dátum vystavenia

delivery\_date        dátum dodania

tax\_point\_date       dátum vzniku daňovej povinnosti

received\_date        dátum prijatia

due\_date             dátum splatnosti

payment\_date         dátum úhrady

posting\_date         dátum zaúčtovania

period\_date          dátum zaradenia do obdobia



Pri faktúre sa použije len časť, pri prijatej faktúre iná časť. Ale pravidlá budú konzistentné.



304\. „Obdobie“ ako prvotriedna entita



V účtovníctve by som mal samostatné obdobia:



accounting\_periods

vat\_periods

bank\_statement\_periods

payroll\_periods

export\_periods



Každé obdobie má stav:



open

in\_review

ready

exported

submitted

locked

reopened



Výhoda: workflow sa viaže na obdobie, nie len na jednotlivé doklady.



305\. DPH obdobie nezávislé od účtovného obdobia



DPH môže byť mesačná alebo štvrťročná, účtovníctvo ročné, banka mesačná.



Model:



vat\_period:

\- 2026-01

\- 2026-Q1



Faktúra potom má:



delivery\_date

vat\_period\_id

accounting\_period\_id



A systém vie upozorniť, ak dátum dodania patrí inde než ručne zvolené DPH obdobie.



306\. „Tax profile“ organizácie



Každá firma by mala mať daňový profil s históriou:



tax\_profiles

\- organization\_id

\- valid\_from

\- valid\_to

\- legal\_form: sole\_trader / sro

\- accounting\_mode: flat\_expenses / tax\_evidence / simple\_accounting / double\_entry

\- vat\_mode: non\_payer / payer / section\_7 / section\_7a

\- vat\_periodicity: monthly / quarterly / none

\- income\_tax\_mode



Nie checkboxy rozhádzané v nastaveniach.



307\. Zmena režimu počas roka



Firma môže prejsť:



neplatiteľ → platiteľ DPH

paušálne výdavky → daňová evidencia

živnosť → s.r.o.

štvrťročná DPH → mesačná DPH



Systém musí vedieť, odkedy platí ktorý režim.



308\. „Effective dating“ na všetkom dôležitom



Dátumová platnosť:



DPH sadzby

daňové pravidlá

účtovné predkontácie

firemné údaje

bankové účty

číselné rady

účtovný režim



Pravidlo: nikdy nemať iba aktuálny stav, ak sa staré doklady nesmú zmeniť.



309\. Výpočty vždy zo snapshotu



Pri vystavení dokladu uložiť:



\- použitá sadzba DPH

\- použitý názov firmy

\- použitá adresa

\- použitý IBAN

\- použitý kurz

\- použité texty

\- použité zaokrúhlenie



Výpočty reportov môžu ísť z normalizovaných dát, ale PDF a audit musia vedieť reprodukovať pôvodný stav.



310\. Reproducibilné PDF



Ak o rok kliknem „zobraziť faktúru“, nesmie sa vygenerovať iné PDF kvôli novej šablóne.



Preto:



pdf\_render\_version

template\_version

snapshot\_json

pdf\_hash

stored\_pdf\_file\_id



Pri zmene šablóny sa staré PDF nemenia.



311\. Systémové „ledger locks“



Nielen zamknutie obdobia používateľom, ale aj technické zámky:



invoice locked because sent

invoice locked because paid

invoice locked because vat\_period\_locked

journal\_entry locked because posted

bank\_transaction locked because reconciled



Každý lock má dôvod.



312\. Reconciliation engine



Bankové párovanie by som oddelil ako vlastný engine:



BankTransaction

&#x20; → MatchingCandidate\[]

&#x20; → MatchDecision

&#x20; → PaymentAllocation



Podporovať:



jedna platba → jedna faktúra

jedna platba → viac faktúr

viac platieb → jedna faktúra

čiastočné úhrady

preplatky

bankový poplatok strhnutý z platby

zápočty

refundácie

313\. Payment allocation model



Platba by nemala byť len invoice.paid\_at.



Model:



payments

payment\_allocations



Príklad:



Platba 1 500 €

\- 1 000 € na FV20260001

\- 500 € na FV20260002



Alebo:



Platba 900 €

\- 900 € na faktúru 1 000 €

\- faktúra zostáva čiastočne uhradená

314\. Zostatok dokladu ako výpočet



Neukladať len status = paid, ale počítať:



invoice\_total

allocated\_payments\_total

credit\_notes\_total

remaining\_balance



Status je odvodený:



remaining\_balance = 0 → paid

0 < remaining\_balance < total → partially\_paid

remaining\_balance < 0 → overpaid

315\. Daňová a účtovná klasifikácia položiek



Každá položka faktúry alebo nákladu by mala mať:



business\_category\_id

vat\_treatment\_id

accounting\_treatment\_id

tax\_deductibility

cost\_center\_id

project\_id



Tým sa dá robiť automatizácia a reporty.



316\. Položková vs. dokladová klasifikácia



Niektoré doklady majú viac režimov:



faktúra s 23 % aj 5 %

náklad čiastočne daňový a čiastočne nedaňový

náklad rozdelený medzi projekty



Preto musí byť možné klasifikovať na úrovni položky, nie iba hlavičky dokladu.



317\. Splitovanie dokladu



Prijatá faktúra 1 000 €:



60 % projekt A

40 % projekt B



Alebo:



80 % podnikanie

20 % súkromné



Model:



document\_splits



Použiteľné pre projekty, strediská, súkromné použitie, nedaňové časti.



318\. „Unposted changes“ warning



Ak sa zmení doklad, ktorý už má účtovný zápis:



Doklad bol zmenený po zaúčtovaní.

Treba aktualizovať účtovný zápis.



Možnosti:



prepočítať návrh

vytvoriť opravný zápis

ponechať a označiť rozdiel

319\. Rozdiel medzi návrhom a realitou



Systém môže navrhnúť účtovanie, ale účtovník potvrdí.



suggested\_posting

approved\_posting

posted\_entry



To je bezpečnejšie než plná automatika.



320\. Certifikované pravidlá vs. vlastné pravidlá



Rozlišovať:



system\_rule

accountant\_rule

user\_rule



Pri probléme vieme, či pravidlo bolo dodané systémom, účtovníkom alebo používateľom.



321\. Účtovnícke šablóny podľa typu firmy



Prednastavené balíky:



Živnostník - neplatiteľ

Živnostník - platiteľ

s.r.o. - neplatiteľ

s.r.o. - platiteľ

s.r.o. - služby do EÚ

Freelancer IT

Malý e-shop

Agentúra



Každý balík nastaví:



číselné rady

kategórie

predkontácie

DPH režimy

dashboard

checklisty

322\. Industry presets



Pre rôzne segmenty:



IT freelancer

marketingová agentúra

stavebné služby

poradenstvo

prenájom nehnuteľností

malý obchod

e-shop



Každý má iné typické náklady, fakturačné položky a riziká.



323\. Modul „externisti/subdodávatelia“



Pre agentúry:



externista

sadza

projekt

prijaté faktúry

marža



Report:



Klient A:

výnosy 5 000 €

externisti 2 000 €

hrubá marža 3 000 €

324\. Náklad priamo priradený k výnosu



Pre maržu:



expense → project\_id → invoice/project



Alebo konkrétne:



prijatá faktúra od externistu → projekt X → faktúra klientovi

325\. Billable expenses



Náklady prefakturované klientovi:



taxi

hosting

licencie

materiál

cestovné



Stav:



unbilled

included\_on\_invoice

reimbursed

non\_billable

326\. Prehľad nefakturovaných nákladov

Projekt A má 320 € nákladov označených ako prefakturovateľné, ale ešte nie sú na faktúre.

327\. Prílohy k faktúre podľa položiek



Ak fakturujem cestovné alebo materiál:



priložiť scan bločku ako prílohu faktúry



Voliteľne, nie automaticky.



328\. Fakturácia v mene klienta / viac dodávateľov



Ak jeden používateľ spravuje viac subjektov:



dodávateľ A

dodávateľ B

živnosť

s.r.o.



Číselné rady, banka, účto oddelene.



329\. Medzifiremné transakcie



Ak používateľ má živnosť aj s.r.o.:



s.r.o. platí živnostníkovi

živnostník fakturuje s.r.o.

pôžička medzi subjektmi



Systém by mal minimálne upozorniť, že ide o prepojené osoby a vyžaduje opatrnosť.



330\. Šablóny účtovného rozvrhu



Pre s.r.o.:



minimalistický účtový rozvrh

štandardný účtový rozvrh

rozšírený s analytikami



Napríklad:



602001 - služby SK

602002 - služby EÚ

518001 - softvér

518002 - telefón

568001 - bankové poplatky



Analytiky od začiatku pomáhajú reportom.



331\. Automatické analytické účty



Keď vznikne nový bankový účet:



221001 Fio

221002 Tatra banka



Keď vznikne pokladňa:



211001 Pokladňa EUR

332\. Saldo podľa partnerov



Účty 311/321 treba viesť podľa partnera:



Klient ABC:

\- FV20260001 1 000 €

\- úhrada 1 000 €

\- saldo 0



Dodávateľ:



PF20260012 300 €

úhrada 300 €

saldo 0

333\. Párovanie účtovného salda



Nie len platba s faktúrou, ale aj účtovne:



311 musí sedieť s otvorenými pohľadávkami

321 musí sedieť s otvorenými záväzkami



Report rozdielov:



Saldo 311 podľa účtovníctva: 4 200 €

Otvorené faktúry: 4 100 €

Rozdiel: 100 €

334\. Kontrola banky vs. účtovníctvo



Zostatok účtu podľa bankových transakcií musí sedieť s účtom 221.



Bankový zostatok Fio: 8 120 €

Účtovný zostatok 221001: 8 120 €



Ak nie:



Rozdiel 50 € — pravdepodobne nezaúčtovaná transakcia.

335\. Pokladničná inventúra



Pre hotovosť:



fyzický stav pokladne

účtovný stav

rozdiel



Doklad:



pokladničné manko / prebytok

336\. Priebežné položky v JÚ



Pri prevodoch medzi bankou a pokladňou:



výdaj z banky

príjem do pokladne

priebežné položky



Systém by to mal robiť automaticky.



337\. Účtovné kontroly ako report



Samostatná stránka:



Kontroly

\- banky sedia

\- saldo 311 sedí

\- saldo 321 sedí

\- DPH report sedí

\- číselné rady sedia

\- neexistujú nezaúčtované doklady

\- neexistujú neznáme transakcie



Zelené/žlté/červené.



338\. „Explain difference“ pri nesúlade



Ak bankový zostatok nesedí:



Možné príčiny:

\- 1 banková transakcia nie je zaúčtovaná

\- 1 transakcia je duplicitná

\- počiatočný stav banky je nesprávny



A linky na konkrétne transakcie.



339\. Počiatočné stavy ako uzamknutý doklad



Pri migrácii:



OpeningBalanceDocument



Obsahuje:



banky

pokladňa

pohľadávky

záväzky

účty

DPH



Auditovať, nemeniť potichu.



340\. Ročné otvorenie účtov



Pre PÚ:



closing\_entries

opening\_entries



Automaticky vytvoriť po uzávierke roka.



341\. Správa účtovného rozvrhu bez zničenia reportov



Ak účtovník deaktivuje účet:



účet sa nedá použiť na nové zápisy

staré zápisy zostávajú



Nikdy nemaže účty s históriou.



342\. Štítok „deprecated“



Pre staré kategórie/predkontácie:



deprecated\_at

replacement\_id



Pri použití starej kategórie systém navrhne novú.



343\. Import pravidiel z účtovníka



Účtovník môže nahrať vlastný CSV mapping:



kategória → účet MD/D

partner → analytika

typ dokladu → predkontácia

344\. Export účtovných zápisov pre iný softvér



Niektorí účtovníci budú chcieť účtovať inde.



Export:



journal\_entries.csv

issued\_invoices.csv

received\_invoices.csv

bank\_transactions.csv

attachments.zip

345\. „Read-only accounting mode“



Ak účtovníctvo vedie externý softvér, náš systém len pripraví:



\- faktúry

\- náklady

\- banka

\- návrhy zaúčtovania

\- export



Ale nepovažuje sa za hlavné účtovníctvo.



346\. „Primary accounting system“ nastavenie



Organizácia si zvolí:



Tento systém je hlavné účtovníctvo: áno/nie



Ak nie:



žiadne finálne účtovné uzávierky

len podklady a exporty



Ak áno:



zamknuté obdobia

denník

hlavná kniha

uzávierky

audit

347\. Právne disclaimer texty v UI



Pri výpočtoch:



Odhad dane je informatívny. Finálne posúdenie urobí účtovník alebo daňový poradca.



Pri DPH:



DPH režim skontrolujte pri neštandardných obchodoch.



Nie všade strašiť, ale jasne nastaviť hranice.



348\. „Schválené účtovníkom“



Pri doklade alebo období:



reviewed\_by\_accountant

reviewed\_at



Používateľ vidí, čo je už bezpečné.



349\. Certifikačný program pre účtovníkov



Ak by produkt rástol:



Certified SlovakInvoice Accountant



Účtovníci, ktorí poznajú systém, môžu byť odporúčaní používateľom.



350\. Marketplace účtovníkov



Neskôr:



Hľadám účtovníka

\- živnostník

\- s.r.o.

\- platiteľ DPH

\- e-commerce



Systém odporučí partnerov.



351\. Support mode „share problem“



Používateľ klikne:



Nahlásiť problém s týmto dokladom



Systém priloží:



entity\_id

stav

validácie

audit

bez citlivých tokenov



Podpora vie rýchlejšie pomôcť.



352\. Anonymizovaný debug export



Pre chyby:



export bez osobných údajov

sumy voliteľne ponechať alebo maskovať



Užitočné pri self-hosted komunite.



353\. Testovací dataset pre legislatívu



V repozitári by som mal:



fixtures/sk/sole\_trader\_non\_vat

fixtures/sk/sro\_vat\_payer

fixtures/sk/eu\_reverse\_charge

fixtures/sk/camt\_bank\_statement



Každý dataset má očakávané reporty.



354\. Golden master PDF testy



PDF faktúry sa ľahko rozbijú.



Testy:



vygeneruj PDF

extrahuj text

porovnaj povinné polia

porovnaj hash vizuálnej šablóny len orientačne

355\. Property-based testy výpočtov



Pre faktúry:



súčet položiek = základ

základ + DPH = celkom

alokácie platieb nikdy neprekročia logiku bez označenia preplatku

dobropis nesmie prekročiť pôvodnú faktúru bez override

356\. Testy zaokrúhľovania



Samostatný balík:



1 položka

viac položiek

zľava

viac DPH sadzieb

cudzia mena

dobropis

čiastočná úhrada

357\. Testy číselných radov pri súbehu



Keď dvaja používatelia vystavia faktúru naraz:



nesmú dostať rovnaké číslo

nesmie vzniknúť diera bez rezervácie



Použiť transakčný zámok.



358\. „Reserved invoice number“



Číslo faktúry môže byť rezervované pri vystavení:



number\_reserved

issued

voided



Ak sa vystavenie nepodarí, číslo má stav:



failed\_reserved



A účtovník vie, čo sa stalo.



359\. Režim koncept bez čísla



Koncept faktúry nemá číslo.



Číslo sa pridelí až pri:



Vystaviť



Nie pri uložení draftu.



360\. Atomic issue operation



Vystavenie faktúry musí byť jedna transakcia:



\- validácia

\- pridelenie čísla

\- uloženie snapshotu

\- výpočet súm

\- vytvorenie PDF

\- hash

\- event InvoiceIssued



Ak niečo zlyhá, stav musí byť jasný.



361\. Outbox pattern pre emaily



Neodosielať email priamo počas transakcie vystavenia.



invoice issued

outbox email job created

worker pošle email

email log updated



Ak email zlyhá, faktúra zostáva vystavená, ale stav emailu je failed.



362\. Outbox pattern pre webhooky



Rovnako webhooky:



event uložený

worker odošle webhook

retry

log

363\. File storage abstrakcia



Podpora:



local storage

S3 compatible

Backblaze B2

MinIO

Azure Blob



Súbor nikdy neidentifikovať len cestou, ale cez file\_id.



364\. Antivírus / malware scan príloh



Pri SaaS:



nahraté PDF/fotky prejsť scanom

stav: pending\_scan / clean / infected



Infikované neotvárať.



365\. Limity uploadu

max veľkosť súboru

povolené typy

počet súborov na doklad

366\. Náhľady príloh



Generovať preview:



PDF thumbnail

image thumbnail

text extract



Uľahčí účtovníkovi prácu.



367\. Fulltext v prílohách



Neskôr:



hľadať v PDF faktúrach

hľadať podľa čísla faktúry v prílohe



OCR/textextract ako async job.



368\. Ochrana citlivých príloh



Niektoré prílohy môžu byť citlivé:



zmluvy

mzdy

osobné doklady



Prístup podľa role.



369\. Per-organization encryption keys



Pre SaaS citlivé veci:



SMTP heslá

API tokeny bánk

OAuth tokeny



Šifrovať aplikačným kľúčom, ideálne per tenant.



370\. Rotácia tajomstiev

SMTP heslo zmenené

API token expiroval

bankové pripojenie treba obnoviť



UI upozorní.



371\. 2FA enforcement



Majiteľ môže vynútiť:



všetci admini musia mať 2FA

účtovníci musia mať 2FA

pri zmene IBAN vždy 2FA

372\. Session management



Používateľ vidí:



aktívne zariadenia

posledné prihlásenie

odhlásiť ostatné zariadenia

373\. Login audit a upozornenia

nové zariadenie

nová krajina

veľa neúspešných pokusov

374\. Permission templates



Prednastavené role:



Owner

Admin

Accountant

Assistant

Approver

Read-only

External worker



Ale možnosť vlastnej role.



375\. Field-level permissions



Napríklad:



asistent môže vidieť faktúry

ale nevidí maržu

nevidí bankový zostatok

nevidí náklady



Nie všetko musí byť MVP, ale model oprávnení nech s tým počíta.



376\. Org-level audit export



Pre compliance:



export audit logu za obdobie

377\. Zákaz úprav cez databázu v self-hosted?



Nie technicky úplne, ale aplikácia môže mať integritné kontroly:



hash chain audit log



Ak niekto mení dáta mimo aplikácie, systém zistí nesúlad.



378\. Hash chain audit log



Každý audit záznam obsahuje:



previous\_hash

current\_hash



Zmena starého záznamu poruší reťaz.



379\. Periodic integrity check



Cron:



skontrolovať hash audit logu

skontrolovať hash PDF

skontrolovať report snapshots

380\. „Trusted archive“ export



Ročný archív:



PDF doklady

JSON dáta

CSV reporty

audit manifest

hash manifest



Použiteľné pri ukončení služby alebo kontrole.



381\. Verejný overovač hashov



Voliteľne:



nahraj PDF

systém povie, či sa zhoduje s archivovaným hashom



Len pre majiteľa/účtovníka, nie verejne bez kontroly.



382\. Integrácia s kalendárom



Termíny:



splatnosti faktúr

DPH termíny

odvody

úlohy



Export iCal feed:



calendar URL

383\. Notifikácie podľa priority

urgent:

\- DPH termín zajtra

\- zmena IBAN

\- veľká faktúra po splatnosti



normal:

\- prišla platba

\- chýba doklad



low:

\- týždenný prehľad

384\. Quiet hours



Neposielať notifikácie v noci, okrem bezpečnostných.



385\. „Snooze“ notifikácií

Pripomenúť zajtra

Pripomenúť o týždeň

Skryť do uzávierky

386\. Inteligentné priority úloh



Nie všetky chyby sú rovnaké:



DPH termín + chýbajúci doklad = vysoká priorita

faktúra 2 dni po splatnosti na 20 € = nízka priorita

387\. Hromadné otázky klientovi



Účtovník vyberie 10 chýbajúcich dokladov a systém pošle jednu prehľadnú výzvu, nie 10 emailov.



388\. Odpoveď klienta bez prihlásenia



Klient dostane bezpečný link:



Doplniť doklady za marec



Môže nahrať súbory a odpovedať bez účtu.



389\. Expirácia upload linku

platný 14 dní

možno zrušiť

audit prístupov

390\. Branding emailov



Firma alebo účtovník:



logo

farby

podpis

kontaktné údaje

391\. Viac emailových identít

faktury@firma.sk

uctovnictvo@firma.sk

meno@firma.sk



Použiteľné podľa typu emailu.



392\. Šablóny emailov podľa jazyka klienta

SK

EN

CZ

DE

HU

393\. Premenné v emailových šablónach

{{ invoice.number }}

{{ invoice.total }}

{{ invoice.due\_date }}

{{ payment.iban }}

{{ payment.variable\_symbol }}

{{ client.name }}



S náhľadom pred odoslaním.



394\. Bezpečný náhľad emailu



Pred hromadným odoslaním:



Ukáž 3 ukážkové emaily



A upozorniť na chýbajúce premenné.



395\. E-mail bounce handling



Ak SMTP/provider vráti bounce:



označiť email ako nedoručený

upozorniť používateľa

navrhnúť opravu adresy

396\. Dokumentové čísla nezávislé od ID



Nikdy nepoužívať databázové ID ako číslo faktúry.



id = interné UUID

number = FV20260001

397\. UUID alebo ULID pre entity



Pre API a bezpečnosť lepšie než sekvenčné ID v URL:



/ invoices / 01HY...



Ale číslo dokladu zostáva ľudské.



398\. Tenant isolation testy



Ak SaaS:



používateľ z firmy A nikdy neuvidí dáta firmy B



Automatické testy na každý endpoint.



399\. Query scoping enforced centrally



V kóde žiadne ručné zabúdanie organization\_id.



Použiť:



tenant context

global scopes

repository layer

row-level security, ak PostgreSQL

400\. Najbližší ďalší krok



Už máme dosť nápadov. Teraz by som ich preklopil do konkrétneho návrhu systému v poradí:



1\. MVP 1.0 rozsah

2\. Doménový model

3\. Databázová schéma

4\. Účtovné jadro

5\. API endpointy

6\. UI obrazovky

7\. Roadmapa



Najrozumnejší ďalší krok je spísať MVP 1.0 backlog: čo presne ide do prvej verzie a čo vedome odkladáme.

