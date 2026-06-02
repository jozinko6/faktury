# Bankové transakcie a párovanie platieb

Bankový modul je jedna z hlavných funkcií systému.

---

# 1. Bankové účty

Organizácia môže mať viac účtov:

- podnikateľský účet,
- súkromný účet použitý pre podnikanie,
- Revolut,
- Wise,
- PayPal,
- Stripe,
- hotovosť / pokladňa.

Model:

```text
bank_accounts
- organization_id
- iban
- bic
- bank_name
- currency
- account_type
- is_default
- valid_from
- valid_to
```

Pre podvojné účtovníctvo môže vzniknúť analytický účet:

```text
221001 Fio
221002 Tatra banka
```

---

# 2. Import výpisov

Podporuj architektúru:

```text
BankStatementParserInterface
CsvBankStatementParser
XlsxBankStatementParser
Camt053Parser
BankSpecificParser
```

MVP:

- univerzálny CSV,
- univerzálny XLSX,
- CAMT.053 skeleton.

Neskôr:

- Fio,
- Tatra banka,
- SLSP,
- VÚB,
- ČSOB,
- mBank,
- UniCredit,
- Revolut,
- Wise,
- PayPal,
- Stripe.

---

# 3. Idempotentné importy

Každý import musí mať:

```text
import_hash
file_hash
transaction_hash
source_file_name
imported_by
imported_at
```

Ak sa nahrá rovnaký výpis dvakrát:

```text
Tento výpis už bol importovaný. Nové transakcie: 0.
```

---

# 4. Banková transakcia

Polia:

```text
id
organization_id
bank_account_id
booking_date
value_date
amount
currency
counterparty_name
counterparty_iban
counterparty_bic
variable_symbol
constant_symbol
specific_symbol
message
transaction_hash
status
```

Stavy:

```text
new
matched
partially_matched
ignored
internal_transfer
needs_document
needs_review
posted
```

---

# 5. Matching engine

Použi samostatný engine:

```text
BankTransaction
  -> MatchingCandidate[]
  -> MatchDecision
  -> PaymentAllocation
```

Kritériá:

- variabilný symbol,
- suma,
- IBAN,
- názov protistrany,
- dátum,
- mena,
- historické pravidlá.

Confidence score:

```text
98 %
- VS sedí
- suma sedí
- IBAN sedí

63 %
- suma sedí
- klient podobný
- VS chýba
```

Automaticky páruj iba vysokú istotu. Pri nízkej istote len navrhni.

---

# 6. Platby a alokácie

Neukladaj len `invoice.paid_at`.

Použi:

```text
payments
payment_allocations
```

Príklady:

```text
Platba 1 500 €
- 1 000 € na FV20260001
- 500 € na FV20260002
```

```text
Platba 900 €
- 900 € na faktúru 1 000 €
- faktúra zostáva partially_paid
```

Stav faktúry odvodiť zo zostatku:

```text
remaining_balance = total - allocations - credit_notes
```

---

# 7. Interné prevody

Rozpoznaj prevody medzi vlastnými účtami:

- rovnaká suma,
- blízke dátumy,
- IBAN patrí organizácii,
- opačný smer.

Účtovanie:

```text
PÚ: 261 peniaze na ceste
JÚ: priebežné položky
```

---

# 8. Bankové poplatky

Rozpoznávaj:

- poplatky banky,
- poplatky platobnej brány,
- kurzové rozdiely,
- refundácie,
- chargebacky.

---

# 9. Platby bez dokladu

Samostatná obrazovka:

```text
Platby bez dokladu
```

Stavy:

- čaká na doklad,
- osobné,
- interný prevod,
- bankový poplatok,
- na kontrolu,
- vyriešené.

---

# 10. Bankové pravidlá

Príklady:

```text
Ak protistrana obsahuje "Sociálna poisťovňa"
→ kategória odvody

Ak protistrana obsahuje "Google Ireland"
→ kategória softvér
→ zahraničná služba
→ vyžaduj faktúru
→ DPH kontrola

Ak IBAN patrí vlastnej organizácii
→ interný prevod
```

Po ručnom zaradení sa opýtaj:

```text
Použiť rovnaké pravidlo aj nabudúce?
```

---

# 11. História párovania

Audituj:

- kto spároval,
- kedy,
- s čím,
- confidence,
- kto odpároval,
- dôvod odpárovania.

---

# 12. Kontroly

Kontroluj:

- duplicitné transakcie,
- nespárované platby,
- platby bez dokladu,
- bankový zostatok vs import,
- bankový zostatok vs účtovníctvo,
- interné prevody.
