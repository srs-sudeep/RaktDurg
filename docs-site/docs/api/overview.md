---
id: overview
title: API Overview
---

# API Reference Overview

## Base URL

| Environment | URL |
|-------------|-----|
| Local development | `http://localhost:8000` |
| Production app | `http://8.231.102.114` |
| Documentation | https://rakt-durg-docs.vercel.app/ |

## Interactive Documentation

Published platform docs (architecture, ops, API guides): https://rakt-durg-docs.vercel.app/

Local FastAPI interactive docs (development only — disabled in production):

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

Production health check: `http://8.231.102.114/health`

## Authentication

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Obtain a token via `POST /auth/token`.

## Response Format

### Success

```json
{
  "id": "uuid",
  "field": "value",
  ...
}
```

### Paginated List

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "size": 20,
  "pages": 8
}
```

### Error

```json
{
  "detail": "Human-readable error message"
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error or business rule violation) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (e.g., calendar double-booking) |
| 422 | Unprocessable Entity (Pydantic validation failure) |
| 503 | Service Unavailable (feature flag disabled — e.g. wallet) |

## Router Modules

| Router | Path Prefix | Description |
|--------|-------------|-------------|
| `auth` | `/auth` | Login, refresh, logout |
| `units` | `/units` | Blood unit lifecycle |
| `stock` | `/stock`, `/public/stock`, `/stream/stock` | Inventory, public view, SSE stream |
| `donors` | `/donors` | Donor registration + screening |
| `sync` | `/sync` | Offline bulk sync |
| `camps` | `/camps` | Donation camp management |
| `wallet` | `/wallet` | Blood credit wallet (feature-flagged) |
| `requisitions` | `/requisitions` | Blood component requisitions |
| `admin` | `/admin` | Feature flags, e-RaktKosh export |
