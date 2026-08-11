---
id: admin
title: Admin API
---

# Admin API

Most endpoints require `superadmin`. Citizen link also allows `district_admin`.

## POST /admin/erakkosh/export

Manually trigger the daily e-RaktKosh export (defaults to today).

**Response:** `{ submission_id, export_date }`

---

## GET /admin/feature-flags

List feature flags.

```json
[{ "name": "wallet_enabled", "is_enabled": false, "description": "…" }]
```

---

## PATCH /admin/feature-flags/\{name\}

Toggle a flag (`is_enabled` query/body as implemented by the router).

---

## POST /admin/citizens/link

Link a citizen login to an existing donor profile.

```json
{ "username": "citizen_ajay", "donor_id": "uuid" }
```

**Roles:** `superadmin`, `district_admin`  
UI: `/citizens/link`

---

## GET /admin/users

Paginated user directory.

```
GET /admin/users?page=1&page_size=50&q=meena&role=doctor&order_by=username&order=asc
```

| Param | Notes |
|-------|-------|
| `q` | username, display_name, email |
| `role` | Role enum |
| `order_by` | `username` \| `role` \| `created_at` \| `last_login_at` \| `display_name` |

---

## PATCH /admin/users/\{id\}

Update `role`, `is_active`, and/or `display_name`.

UI: `/users`

---

## Organizers

Mounted under admin paths (see organizers router):

| Method | Path | Notes |
|--------|------|-------|
| GET | `/admin/organizers` | Login-linked organizers — `q`, `org_category`, `is_verified`, sort |
| GET | `/admin/organizer-directory` | Outreach directory — `q`, `category`, sort |

UI: `/organizers`, `/organizer-directory`

---

## Feature flags

| Name | Default | Description |
|------|---------|-------------|
| `wallet_enabled` | `false` | Enable blood credit wallet endpoints / UI |
