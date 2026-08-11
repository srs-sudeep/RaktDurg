---
id: requisitions
title: Requisitions
---

# Requisitions

## Overview

A requisition is a request from a hospital ward for specific blood components. The inventory team reserves matching components using FEFO, then issues them when the ward collects.

## Status Flow

```
pending → partially_reserved → fully_reserved → partially_issued → issued
    └──────────────────────────────────────────────────────────→ cancelled
```

### Cancellation Rules

| Status | Can Cancel |
|--------|-----------|
| `pending` | Yes — no action needed |
| `partially_reserved` | Yes — unreserves held components |
| `fully_reserved` | Yes — unreserves all components |
| `partially_issued` | **No** |
| `issued` | **No** |
| `cancelled` | **No** |

When unreserving, a `LedgerReasonEnum.UNRESERVE` entry is posted for each component.

## Creating a Requisition

```http
POST /requisitions
Authorization: Bearer <token>

{
  "patient_name": "Sunita Devi",
  "patient_id": "WARD-2024-0042",
  "ward": "ICU-2",
  "blood_group": "B+",
  "component_type": "packed_rbc",
  "quantity": 2,
  "priority": "urgent",
  "clinical_notes": "Post-operative anaemia"
}
```

## Reserve (FEFO)

```http
POST /requisitions/{id}/reserve
Authorization: Bearer <token>  (inventory_officer or admin)
```

Calls `reserve_fefo()` — selects the 2 packed_rbc units with the earliest expiry date.

If fewer than `quantity` units are available, status becomes `partially_reserved`.

## Issue

```http
POST /requisitions/{id}/issue
Authorization: Bearer <token>  (inventory_officer or admin)
```

Only works when status is `fully_reserved`. Creates `Issue` records and updates component status to `issued`.

## Record Transfusion

```http
POST /requisitions/issues/{issue_id}/transfusion
Authorization: Bearer <token>  (medical_officer or admin)

{
  "transfused_at": "2024-01-15T14:30:00Z",
  "reaction": null,
  "notes": "Uneventful"
}
```

Updates component status to `transfused` and logs `LedgerReasonEnum.TRANSFUSED`.

## Ledger Entries

| Action | Reason | Qty sign |
|--------|--------|----------|
| Reserve | `reserve` | 0 (reserved, not removed) |
| Issue | `issue` | -1 per component |
| Transfusion | `transfused` | 0 (already issued) |
| Unreserve | `unreserve` | +1 per component |
