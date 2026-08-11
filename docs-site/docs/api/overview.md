---
id: overview
title: API Overview
---

# API Reference Overview

## Base URL

| Environment | URL |
|-------------|-----|
| Local development | `http://localhost:8000` |
| Production app | `http://8.231.102.114` (same-origin from the web app) |
| Documentation | https://rakt-durg-docs.vercel.app/ |

Routes live at the **root** (`/auth/token`, `/donors`, `/units`) — there is **no** `/api/v1` prefix.

## Interactive Documentation

Published platform docs: https://rakt-durg-docs.vercel.app/

Local FastAPI interactive docs (development only — disabled in production):

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

Production health: `http://8.231.102.114/health`

## Authentication

```http
Authorization: Bearer <access_token>
```

Obtain a token via `POST /auth/token` with JSON `{"username","password"}`.

Example (demo seed / production):

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

Full credential tables: [Demo & Live Links](../demo.md).

## List query conventions

Most paginated staff lists accept:

| Param | Meaning |
|-------|---------|
| `page` | 1-based page |
| `page_size` | Page length (endpoint-specific max) |
| `q` | Case-insensitive search across allowlisted columns |
| `order_by` | Allowlisted column key |
| `order` | `asc` or `desc` |

Shared helpers: `backend/app/core/query.py`.

### Paginated response

```json
{
  "items": [],
  "total": 150,
  "page": 1,
  "page_size": 50
}
```

## Error shape

```json
{ "detail": "Human-readable error message" }
```

| Code | Meaning |
|------|---------|
| 200 / 201 | OK / Created |
| 400 | Bad request / business rule |
| 401 | Missing or invalid token |
| 403 | Insufficient role |
| 404 | Not found |
| 409 | Conflict |
| 422 | Validation failure |
| 503 | Feature flag disabled (e.g. wallet) |

## Router modules

| Router | Path prefix | Description |
|--------|-------------|-------------|
| `auth` | `/auth` | Login, refresh, logout, me |
| `units` | `/units` | Blood unit lifecycle |
| `stock` | `/stock`, `/public/stock`, `/stream/stock` | Inventory, public view, SSE |
| `donors` | `/donors` | Donor registration + screening |
| `sync` | `/sync` | Offline bulk sync |
| `camps` | `/camps` | Camps, coupons, staff bookings list |
| `wallet` | `/wallet` | Blood credit wallet (feature-flagged) |
| `requisitions` | `/requisitions` | FEFO reserve / issue |
| `admin` | `/admin` | Flags, users, e-RaktKosh, citizen link |
| `organizers` | `/admin/organizers`, `/admin/organizer-directory` | Organizer accounts + outreach list |

Staff UI wiring for these lists: [Staff UI & Tables](../web/staff-ui.md).
