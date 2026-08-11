---
id: admin
title: Admin API
---

# Admin API

All endpoints in this section require the `admin` role.

## POST /admin/erakkosh/export

Manually trigger the daily e-RaktKosh export for a specific date.

```json
{"export_date": "2024-01-15"}
```

**Response:**
```json
{
  "task_id": "celery-task-uuid",
  "export_date": "2024-01-15",
  "status": "queued"
}
```

The export runs asynchronously via Celery. In development, writes JSON to `/tmp/erakkosh_exports/`.

---

## GET /admin/feature-flags

List all feature flags and their current values.

**Response:**
```json
[
  {
    "name": "wallet_enabled",
    "value": false,
    "description": "Enable blood credit wallet",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

---

## PATCH /admin/feature-flags/{name}

Update a feature flag value.

```json
{"value": true}
```

**Example — enable wallet:**

```http
PATCH /admin/feature-flags/wallet_enabled
Authorization: Bearer <admin-token>

{"value": true}
```

After this call, all wallet endpoints become functional.

---

## Current Feature Flags

| Name | Default | Description |
|------|---------|-------------|
| `wallet_enabled` | `false` | Enable blood credit wallet endpoints |
