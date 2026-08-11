---
id: dpdp
title: DPDP Compliance
---

# DPDP Compliance

RAKT Durg is designed to comply with India's **Digital Personal Data Protection (DPDP) Act 2023**.

## Key Requirements & Implementation

### Consent

| Requirement | Implementation |
|-------------|----------------|
| Explicit consent before data collection | `donors.consent_given` (boolean, required) |
| Consent date recorded | `donors.consent_date` (date, required) |
| Consent must precede data collection | Schema enforced: both fields required at registration |

### Data Minimisation

Only the minimum data necessary is collected:
- **Phone**: for operational contact (camp notifications, appointment reminders) — not for marketing
- **Date of birth**: for eligibility assessment (age requirement)
- **Blood group**: for matching
- No unnecessary personal attributes collected

### No Raw Aadhaar

RAKT Durg stores only a **masked ABHA reference**:

```sql
-- donors table
abha_reference TEXT  -- e.g. "ABHA-XXXX-XXXX-5678", never the 14-digit number
```

The application never receives or processes the raw Aadhaar or ABHA number. Identity verification is delegated to the ABHA adapter:

```python
# adapters/abha.py
async def verify_abha_reference(reference: str) -> ABHAVerifyResult:
    # In production: calls ABHA API — returns verified boolean, not the raw ID
    # The raw ABHA number never enters RAKT Durg's codebase
```

### Data Retention

```sql
-- created_at tracked on all tables
-- A periodic Celery task enforces retention limits
-- Default retention: 7 years (blood transfusion records)
-- Donor profiles: retained while donor is active
```

### Right to Access

Donors can view their own data via the mobile app and web portal. The `donor` role has read access to:
- Their own profile
- Their donation history
- Their screening results
- Their wallet balance

### Right to Erasure

Data erasure requests are handled through the admin panel. Note: Blood transfusion records may be legally required to be retained for 7+ years under NBTC guidelines.

### Audit Trail

All data modifications are logged in `audit_logs`:
- Actor (who made the change)
- Action (what was changed)
- Old and new values (JSONB)
- Timestamp

The audit log is **append-only** (PostgreSQL RULE prevents UPDATE/DELETE).

### No Secrets in Source

```bash
# .gitignore includes:
.env
*.env
backend/.env
```

All credentials are passed via environment variables or Docker secrets. No passwords, API keys, or JWT secrets in the codebase.

## Health Data Classification

Blood donation and health screening data is classified as **sensitive personal data** under DPDP. Additional protections:
- Access restricted to authorised clinical roles
- `citizen_read` role has no access to health data
- All access logged in audit trail
- Data encrypted at rest (PostgreSQL full-disk encryption in production)
- Data encrypted in transit (HTTPS/TLS in production)
