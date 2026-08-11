---
id: phase-5
title: "Phase 5: Requisitions, Notifications & e-RaktKosh"
---

# Phase 5: Requisitions, Notifications & e-RaktKosh

## Goal

Complete the clinical workflow with blood requisitions from hospital wards, add notification infrastructure, and implement the daily e-RaktKosh export.

## Requisition Workflow

```
Hospital ward needs blood
     ↓
POST /requisitions  (medical_officer or inventory_officer)
     ↓ status: pending
POST /requisitions/{id}/reserve  (inventory_officer)
     ↓ FEFO reserves components, status: fully_reserved
POST /requisitions/{id}/issue  (inventory_officer)
     ↓ Components physically handed over, status: issued
POST /requisitions/issues/{id}/transfusion  (medical_officer)
     ↓ Transfusion confirmed, component status: transfused
```

### Cancellation Rules

| Current Status | Can Cancel? | Effect |
|----------------|-------------|--------|
| `pending` | Yes | Simple cancel |
| `partially_reserved` | Yes | Unreserves components (UNRESERVE ledger entry) |
| `fully_reserved` | Yes | Unreserves all components |
| `partially_issued` | No | Cannot cancel after issue |
| `issued` | No | Cannot cancel |
| `cancelled` | No | Already cancelled |

## Notifications

### Channels

```python
class NotificationChannelEnum(str, Enum):
    whatsapp = "whatsapp"
    sms      = "sms"
    in_app   = "in_app"
```

Note: **No email channel.** WhatsApp and SMS cover the target rural demographic.

### Celery Task

```python
@celery.task(bind=True, max_retries=3)
def send_notification(self, notification_id: str):
    # Load notification from DB
    # Route to adapter based on channel
    # Mark SENT or FAILED
    # Retry with exponential backoff on failure
```

### Dev Adapters

In `ENVIRONMENT=development`, all adapters return mock results:

```python
async def send_sms(phone: str, message: str) -> dict:
    # Returns {"status": "mock_sent", "provider": "mock"}
    # In production: integrate with real SMS gateway

async def send_whatsapp(phone: str, message: str) -> dict:
    # Returns {"status": "mock_sent", "provider": "mock"}
    # In production: integrate with WhatsApp Business API
```

## e-RaktKosh Integration

### Daily Export

The `erakkosh_daily_export` Celery task runs every day at 23:50 via Celery beat:

```python
@celery.task
def erakkosh_daily_export(export_date_iso: str | None = None):
    # Default: today's date
    # Queries: donation count + available units by blood group
    # Calls: export_daily(date, payload)
    # Dev: writes JSON to /tmp/erakkosh_exports/
    # Prod: POST to e-RaktKosh API endpoint
```

### Export Payload Format

```json
{
  "facility_code": "RKDURG",
  "export_date": "2024-01-15",
  "donations_today": 12,
  "available_units": {
    "A+": {"whole_blood": 2, "packed_rbc": 5, "plasma": 3},
    "O+": {"whole_blood": 1, "packed_rbc": 8}
  }
}
```

### Manual Trigger

```http
POST /admin/erakkosh/export
Authorization: Bearer <admin-token>

{"export_date": "2024-01-15"}
```

## Admin Feature Flags

```http
GET /admin/feature-flags
PATCH /admin/feature-flags/{name}
```

Currently seeded flags:
- `wallet_enabled` — default `false`

## API Endpoints Added

| Method | Path | Roles |
|--------|------|-------|
| POST | `/requisitions` | admin, medical_officer, inventory_officer |
| GET | `/requisitions` | admin, medical_officer, inventory_officer |
| GET | `/requisitions/\{id\}` | admin, medical_officer, inventory_officer |
| POST | `/requisitions/\{id\}/reserve` | admin, inventory_officer |
| POST | `/requisitions/\{id\}/issue` | admin, inventory_officer |
| POST | `/requisitions/\{id\}/cancel` | admin, medical_officer, inventory_officer |
| POST | `/requisitions/issues/\{id\}/transfusion` | admin, medical_officer |
| POST | `/admin/erakkosh/export` | admin |
| GET | `/admin/feature-flags` | admin |
| PATCH | `/admin/feature-flags/\{name\}` | admin |
