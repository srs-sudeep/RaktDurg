---
id: wallet
title: Wallet
---

# Blood Credit Wallet

:::warning Disabled by Default
All wallet endpoints return `HTTP 503` until the admin enables the feature flag. See [Phase 4](../phases/phase-4.md).
:::

## Concepts

- **Wallet** — per-donor, tracks `balance` (integer credits)
- **Transaction** — each credit/debit is immutable (`earn`, `redeem`, `expire`, `adjust`)
- **Family link** — a verified link allowing a family member to redeem on behalf of the primary donor

## Transaction Types

| Type | Direction | Trigger |
|------|-----------|---------|
| `earn` | + | Donation recorded |
| `redeem` | - | Blood component issued to donor/family |
| `expire` | - | Credits older than 2 years auto-expired |
| `adjust` | ± | Manual admin correction |

## Credit for Donation

```http
POST /wallet/donors/{donor_id}/credit
Authorization: Bearer <token>  (admin or medical_officer)

{
  "amount": 1,
  "reason": "Donation on 2024-01-15",
  "reference_id": "donation-uuid"
}
```

## Redemption

```http
POST /wallet/donors/{donor_id}/redeem
Authorization: Bearer <token>

{
  "amount": 1,
  "beneficiary_id": "family-donor-uuid",  # can equal donor_id
  "reason": "Blood required for surgery",
  "reference_id": "requisition-uuid"
}
```

If `beneficiary_id` differs from `donor_id`, a verified family link must exist. Insufficient balance raises `HTTP 400`.

## Balance Constraint

The database-level `CHECK (balance >= 0)` constraint prevents the balance going negative. Any transaction that would cause this is rejected:

```python
try:
    await db.flush()
except IntegrityError as e:
    if "ck_balance_non_negative" in str(e):
        raise InsufficientBalanceError("Not enough credits")
    raise
```

## Family Links

```http
POST /wallet/donors/{donor_id}/family-links
{
  "linked_donor_id": "uuid",
  "relationship": "spouse"
}
```

Family members must themselves be registered donors in the system. The link is verified by a medical officer before it becomes active.

## Enabling the Wallet

```http
PATCH /admin/feature-flags/wallet_enabled
Authorization: Bearer <admin-token>

{"value": true}
```
