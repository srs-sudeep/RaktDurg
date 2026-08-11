---
id: wallet
title: Wallet API
---

# Wallet API

:::warning Feature Flag
All endpoints return `503 Service Unavailable` when `wallet_enabled = false`. Enable via `PATCH /admin/feature-flags/wallet_enabled`.
:::

## GET /wallet/donors/\{id\}

Get donor wallet balance and summary.

**Roles:** admin, medical_officer, donor (own only)

**Response:**
```json
{
  "donor_id": "uuid",
  "balance": 3,
  "total_earned": 5,
  "total_redeemed": 2,
  "last_transaction_at": "2024-01-15T10:00:00Z"
}
```

---

## POST /wallet/donors/\{id\}/credit

Credit wallet for a donation.

**Roles:** admin, medical_officer

```json
{
  "amount": 1,
  "reason": "Donation on 2024-01-15",
  "reference_id": "donation-uuid"
}
```

---

## POST /wallet/donors/\{id\}/redeem

Redeem credits. Beneficiary may be the donor or a verified family member.

**Roles:** admin, medical_officer, donor (own wallet)

```json
{
  "amount": 1,
  "beneficiary_id": "uuid",
  "reason": "Blood required for surgery",
  "reference_id": "requisition-uuid"
}
```

**Errors:**
- `400` — insufficient balance
- `400` — beneficiary not linked as family member

---

## GET /wallet/donors/\{id\}/transactions

Paginated transaction history.

```json
{
  "items": [
    {
      "id": "uuid",
      "type": "earn",
      "amount": 1,
      "balance_after": 3,
      "reason": "Donation",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1
}
```

---

## POST /wallet/donors/\{id\}/family-links

Link a family member.

```json
{
  "linked_donor_id": "uuid",
  "relationship": "spouse"
}
```
