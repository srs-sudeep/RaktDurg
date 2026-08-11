---
id: blood-units
title: Blood Units
---

# Blood Units

## Overview

A blood unit represents a single bag collected from a donor. It has a barcode, a lifecycle state, and can be separated into components.

## Barcode Format

```
R  D  [facility_code:6]  [sequence:06d]  [check:1]
└──┘  └─────────────────┘ └─────────────┘└────────┘
 2         6                   6              1   = 15 chars total
```

Example: `RDRKDURG000001K`

- `RD` — fixed prefix (Rakt Durg)
- `RKDURG` — 6-char facility code
- `000001` — 6-digit zero-padded sequence
- `K` — Luhn mod-36 check character

```python
# backend/app/core/barcode.py
LUHN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def luhn_check_char(payload: str) -> str:
    total = 0
    for i, c in enumerate(reversed(payload)):
        n = LUHN_CHARSET.index(c)
        if i % 2 == 0:
            n *= 2
            if n >= len(LUHN_CHARSET):
                n -= len(LUHN_CHARSET) - 1
        total += n
    check_index = (len(LUHN_CHARSET) - total % len(LUHN_CHARSET)) % len(LUHN_CHARSET)
    return LUHN_CHARSET[check_index]

def validate_barcode(barcode: str) -> bool:
    if len(barcode) != 15 or not barcode.startswith("RD"):
        return False
    payload = barcode[:-1]
    expected = barcode[-1]
    return luhn_check_char(payload) == expected
```

## Lifecycle States

```
collected → tested → separated → stored → reserved → issued → transfused
    ↓           ↓         ↓         ↓         ↓          ↓
 discarded  discarded  discarded  discarded  discarded  discarded
                                    ↓
                                 expired
```

All transitions are validated by `VALID_TRANSITIONS` dict in `services/units.py`.

## Test Panels

Before a unit can be released or its lifecycle advanced past `tested`, all five panels must be recorded:

| Panel | Full Name |
|-------|-----------|
| HIV | Human Immunodeficiency Virus |
| HBsAg | Hepatitis B Surface Antigen |
| HCV | Hepatitis C Virus |
| Malaria | Malaria Parasite |
| VDRL | Venereal Disease Research Laboratory (Syphilis) |

```python
# POST /units/{unit_id}/tests
{
  "panels": [
    {"panel_name": "HIV", "result": "negative"},
    {"panel_name": "HBsAg", "result": "negative"},
    {"panel_name": "HCV", "result": "negative"},
    {"panel_name": "Malaria", "result": "negative"},
    {"panel_name": "VDRL", "result": "negative"}
  ]
}
```

When all 5 panels recorded with negative results → `release_status = "approved"`, `lifecycle_state = "tested"`.

## Component Separation

```python
# POST /units/{unit_id}/components
{
  "components": [
    {"component_type": "packed_rbc", "volume_ml": 280, "expiry_datetime": "2024-02-25T00:00:00Z"},
    {"component_type": "plasma", "volume_ml": 150, "expiry_datetime": "2025-01-15T00:00:00Z"},
    {"component_type": "platelets", "volume_ml": 60, "expiry_datetime": "2024-01-22T00:00:00Z"}
  ]
}
```

Each component gets a `LedgerReasonEnum.COLLECTION` ledger entry. Unit state transitions to `separated`.

## Component Types

| Type | Typical Shelf Life |
|------|-------------------|
| `whole_blood` | 35 days |
| `packed_rbc` | 35–42 days |
| `plasma` | 1 year (frozen) |
| `platelets` | 5–7 days |
| `cryo` | 1 year (frozen) |

## FEFO Selection

When reserving for a requisition, components are selected in expiry order:

```python
# backend/app/core/fefo.py
async def reserve_fefo(db, facility_id, blood_group, component_type, quantity):
    result = await db.execute(
        select(Component)
        .where(
            Component.facility_id == facility_id,
            Component.blood_group == blood_group,
            Component.component_type == component_type,
            Component.status == "available",
        )
        .order_by(Component.expiry_datetime.asc())
        .limit(quantity)
        .with_for_update(skip_locked=True)
    )
    return result.scalars().all()
```

`SKIP LOCKED` ensures concurrent reservation requests never block each other — each picks the next available set.
