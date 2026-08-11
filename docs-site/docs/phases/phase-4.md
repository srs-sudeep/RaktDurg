---
id: phase-4
title: "Phase 4: Blood Credit Wallet"
---

# Phase 4: Blood Credit Wallet

:::warning Feature-Flagged
The wallet is **disabled in production** until sign-off. All wallet routes return `HTTP 503` when `feature_flags.wallet_enabled = FALSE`. No code changes are needed to activate it — just update the feature flag via the admin API.
:::

## Goal

Reward donors with blood credits that can be redeemed by the donor or a verified family member for blood access priority or discounts.

## Feature Flag Check

Every wallet service function begins with:

```python
async def _assert_enabled(db: AsyncSession):
    flag = await db.scalar(
        select(FeatureFlag).where(FeatureFlag.name == "wallet_enabled")
    )
    if not flag or not flag.value:
        raise WalletDisabledError("Wallet feature is not enabled")
```

`WalletDisabledError` maps to HTTP 503 in the router.

## Transaction Types

```python
class WalletTxnTypeEnum(str, Enum):
    earn   = "earn"     # credit for donation
    redeem = "redeem"   # use credits for blood access
    expire = "expire"   # auto-expired by Celery task
    adjust = "adjust"   # manual admin correction
```

Note: The values are `earn`/`redeem` — NOT `credit`/`debit`.

## Wallet Balance

```sql
-- Non-negative balance enforced at DB level
ALTER TABLE wallets ADD CONSTRAINT ck_balance_non_negative CHECK (balance >= 0);
```

If a redemption would make the balance negative, the `IntegrityError` from the constraint is caught and re-raised as `InsufficientBalanceError` (HTTP 400).

## Family Links

A donor can link verified family members. A verified family member can redeem credits on behalf of the primary donor:

```http
POST /wallet/donors/{donor_id}/family-links
{
  "linked_donor_id": "uuid",
  "relationship": "spouse"
}
```

Before redemption, if `beneficiary_id != donor_id`, the service checks that a verified family link exists.

## Credit Expiry

Earned credits expire after 2 years. The Celery beat task `expire_wallet_credits` runs daily:

```python
@celery.task
def expire_wallet_credits():
    # First check wallet_enabled flag
    # Find EARN transactions older than 2 years with remaining balance
    # Insert EXPIRE transactions for the expired amount
    # Update wallet balance
```

## API Endpoints Added

| Method | Path | Roles |
|--------|------|-------|
| GET | `/wallet/donors/{id}` | admin, medical_officer, donor (own only) |
| POST | `/wallet/donors/{id}/credit` | admin, medical_officer |
| POST | `/wallet/donors/{id}/redeem` | admin, medical_officer, donor (own only) |
| GET | `/wallet/donors/{id}/transactions` | admin, medical_officer, donor (own only) |
| POST | `/wallet/donors/{id}/family-links` | admin, medical_officer, donor (own only) |

All endpoints return `503 Service Unavailable` when `wallet_enabled = FALSE`.

## Activating the Wallet

```http
PATCH /admin/feature-flags/wallet_enabled
Authorization: Bearer <admin-token>

{"value": true}
```

Or via the admin UI in the web dashboard.
