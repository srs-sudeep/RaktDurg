---
id: phase-1
title: "Phase 1: Unit Tracking & Stock"
---

# Phase 1: Unit Tracking & Stock

## Goal

Implement blood unit lifecycle management, barcode generation, FEFO reservation, stock ledger, and real-time stock streaming.

## Features Implemented

### Barcode System

Format: `RD + [facility_code:6] + [sequence:06d] + [check:1]` = **15 characters**

Check character uses **Luhn mod-36** (digits + A–Z):

```python
# backend/app/core/barcode.py
LUHN_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"

def luhn_check_char(payload: str) -> str:
    # Luhn mod-36 algorithm
    ...

async def next_barcode(facility_id, facility_code, db) -> str:
    # SELECT … FOR UPDATE on barcode_sequences
    # atomic increment, no race condition
    ...
```

Example barcode: `RDRKDURG000001K`

### Unit Lifecycle State Machine

Nine states with allowed transitions:

```python
VALID_TRANSITIONS = {
    COLLECTED: {TESTED, DISCARDED},
    TESTED: {SEPARATED, STORED, DISCARDED},
    SEPARATED: {STORED, DISCARDED},
    STORED: {RESERVED, DISCARDED, EXPIRED},
    RESERVED: {STORED, ISSUED, DISCARDED},
    ISSUED: {TRANSFUSED, DISCARDED},
    TRANSFUSED: set(),
    DISCARDED: set(),
    EXPIRED: set(),
}
```

Terminal states (`transfused`, `discarded`, `expired`) cannot transition further.

### Test Panel Requirements

Five mandatory panels before a unit can be released:

```python
REQUIRED_TEST_PANELS = frozenset(["HIV", "HBsAg", "HCV", "Malaria", "VDRL"])
```

All panels must be recorded (pass or fail) before `release_status` changes to `approved`.

### Component Separation

A whole blood unit can be separated into components:

```python
# POST /units/{unit_id}/components
# Creates: packed_rbc, plasma, platelets, cryo (as requested)
# Logs LedgerReasonEnum.COLLECTION for each component
```

### FEFO Reservation

```sql
SELECT * FROM components
WHERE facility_id = :fid
  AND blood_group = :bg
  AND component_type = :ct
  AND status = 'available'
ORDER BY expiry_datetime ASC
LIMIT :qty
FOR UPDATE SKIP LOCKED;
```

`SKIP LOCKED` means concurrent reservations never block each other — they pick the next available component.

### Stock Ledger

Every inventory change writes a ledger entry:

```python
LedgerReasonEnum values:
  collection    # component separated from unit
  reserve       # reserved for requisition
  unreserve     # reservation cancelled
  issue         # issued to ward
  transfused    # transfusion recorded
  discard       # discarded (expired/contaminated)
  expiry        # auto-expired by Celery task
  transfer_in   # received from another facility
  transfer_out  # sent to another facility
  adjustment    # manual correction
```

### Real-time Stock via SSE

```python
# GET /stream/stock/{facility_id}  — requires auth
async def stock_stream(facility_id, request, token):
    redis = Redis.from_url(settings.REDIS_URL)
    pubsub = redis.pubsub()
    await pubsub.subscribe("stock:updates")
    async for message in pubsub.listen():
        if await request.is_disconnected():
            break
        yield ServerSentEvent(data=message["data"])
        # keepalive every 30s
```

## API Endpoints Added

| Method | Path | Roles |
|--------|------|-------|
| POST | `/units` | admin, medical_officer, lab_tech, phlebotomist |
| GET | `/units/scan/\{barcode\}` | admin, medical_officer, lab_tech, phlebotomist, inventory_officer |
| GET | `/units/\{unit_id\}` | (same) |
| POST | `/units/\{unit_id\}/tests` | admin, medical_officer, lab_tech |
| POST | `/units/\{unit_id\}/components` | admin, medical_officer, lab_tech |
| PATCH | `/units/\{unit_id\}/state` | admin, medical_officer, lab_tech, inventory_officer |
| GET | `/stock/\{facility_id\}` | Authenticated staff |
| GET | `/public/stock/\{facility_id\}` | No auth |
| GET | `/stream/stock/\{facility_id\}` | Authenticated staff |

## Web Dashboard

- `/dashboard` route subscribes to SSE stream
- Falls back to TanStack Query polling (30s interval) if SSE disconnects
- Grid view: rows = component type, columns = blood group, cells = count
- `/public/stock` — unauthenticated, shows total per blood group
