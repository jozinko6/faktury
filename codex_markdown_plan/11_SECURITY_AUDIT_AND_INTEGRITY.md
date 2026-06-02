# Bezpečnosť, audit a integrita

Systém pracuje s účtovnými, daňovými a finančnými dátami. Bezpečnosť musí byť súčasťou architektúry od začiatku.

---

# 1. Tenant isolation

Ak je systém multi-tenant, každý endpoint a query musia byť scopeované na organizáciu.

Použi:

- tenant context,
- repository layer,
- global scopes,
- prípadne row-level security pri PostgreSQL.

Testuj, že používateľ firmy A nikdy neuvidí dáta firmy B.

---

# 2. Role

Prednastavené role:

```text
Owner
Admin
Accountant
Assistant
Approver
Read-only
External worker
Reviewer
```

Príklady:

- asistent môže vystavovať faktúry,
- účtovník môže účtovať,
- read-only vidí reporty,
- externista vidí len projekt,
- reviewer môže komentovať, ale nemení dáta.

---

# 3. Field-level permissions

Neskôr podporuj:

- asistent nevidí maržu,
- asistent nevidí bankový zostatok,
- externista nevidí faktúry,
- reviewer nevidí citlivé tokeny.

---

# 4. Audit log

Audituj:

- vytvorenie dokladu,
- zmenu sumy,
- zmenu DPH,
- zmenu IBAN,
- odoslanie faktúry,
- spárovanie platby,
- odpárovanie platby,
- zmenu predkontácie,
- uzamknutie obdobia,
- odomknutie obdobia,
- export,
- zmenu práv,
- zobrazenie citlivých údajov.

Audit záznam:

```text
who
when
organization_id
entity_type
entity_id
action
old_value
new_value
ip_address
user_agent
reason
previous_hash
current_hash
```

---

# 5. Hash chain audit log

Každý audit záznam môže obsahovať:

```text
previous_hash
current_hash
```

Zmena starého záznamu poruší reťaz.

---

# 6. Integrita PDF

Každé finálne PDF má:

- SHA-256 hash,
- snapshot hash,
- template version,
- render version,
- created_by,
- created_at.

Odoslané PDF sa nemení.

---

# 7. Zmena IBAN

Zmena IBAN je citlivá.

Pri zmene:

- vytvor audit,
- vyžaduj dôvod,
- priprav možnosť 2FA,
- upozorni majiteľa,
- staré faktúry nech používajú pôvodný snapshot.

Pri prijatej faktúre:

```text
Dodávateľ má nový IBAN, ktorý sme predtým nevideli.
Overte IBAN pred úhradou.
```

---

# 8. Upload bezpečnosť

Podporuj:

- limity veľkosti,
- povolené typy,
- malware scan rozhranie,
- stav `pending_scan`,
- súbory ukladať cez `file_id`, nie len cestu,
- náhľady generovať async.

---

# 9. Citlivé tokeny

Šifruj:

- SMTP heslá,
- API tokeny,
- OAuth tokeny,
- bankové tokeny.

Podporuj rotáciu tajomstiev.

---

# 10. 2FA a session management

Neskôr:

- vynútenie 2FA pre adminov,
- 2FA pri zmene IBAN,
- aktívne zariadenia,
- odhlásiť ostatné zariadenia,
- upozornenie na nové zariadenie.

---

# 11. Soft delete vs legal delete

Rozlišuj:

```text
soft_delete
archive
void
cancel
legal_delete/anonymize
```

Účtovné doklady nemaž natvrdo.

---

# 12. Zamknuté obdobia

Ak je obdobie zamknuté:

- doklady sa nemenia,
- opravy len cez opravný doklad,
- odomknutie len s dôvodom,
- auditovať odomknutie,
- reportovať zmeny po odomknutí.

---

# 13. Trusted archive

Ročný archív môže obsahovať:

- PDF doklady,
- JSON dáta,
- CSV reporty,
- audit manifest,
- hash manifest.

---

# 14. Health checks

Pre SaaS aj self-hosted:

```text
/api/health
/api/health/db
/api/health/queue
/api/health/storage
```

Self-hosted diagnostika:

- PHP/Node verzia,
- DB verzia,
- storage práva,
- cron,
- queue worker,
- email,
- PDF renderer,
- zálohy.
