---
id: staff-ui
title: Staff UI & Tables
---

# Staff UI & Tables

The staff portal is a dense blood-bank ERP shell — dark slate sidebar, flat white content, IBM Plex Sans — not a marketing/SaaS dashboard.

## Shell

| Piece | Location | Notes |
|-------|----------|-------|
| Layout | `web/src/components/AppLayout.tsx` | Sidebar nav by role, page title from `page-meta.ts` |
| RBAC | `web/src/lib/rbac.ts` | `ROUTE_ROLES` + `canAccess()` |
| Page titles | `web/src/lib/page-meta.ts` | Header title/description per path |
| Toasts | `web/src/lib/toast.ts` | Success + global API errors (deduped ~2.5s) |

### Main staff routes

| Path | Purpose |
|------|---------|
| `/dashboard` | Role KPI strip + live stock matrix |
| `/units`, `/donors`, `/requisitions` | Inventory / donors / FEFO requests |
| `/camps`, `/camps/approval`, `/camps/bookings` | Camp lifecycle |
| `/organizers`, `/organizer-directory` | Login-linked organizers vs outreach list |
| `/citizens/link` | Link citizen login ↔ donor |
| `/users` | Role / active management (superadmin) |
| `/admin` | Feature flags + e-RaktKosh |
| `/profile` | Signed-in user profile |

## Shared table stack

List pages use the same controls:

| Piece | File |
|-------|------|
| Query state | `web/src/lib/table-query.ts` — `useTableQuery`, `applyClientTable` |
| Toolbar | `web/src/components/ui/table-toolbar.tsx` — search + filter selects + pagination |
| Table | `web/src/components/ui/data-table.tsx` — sortable headers, toolbar, footer |

### Server-side list params

Backend helpers live in `backend/app/core/query.py` (`apply_ilike_search`, `apply_order`).

Typical query string on list endpoints:

```
?page=1&page_size=50&q=meena&order_by=created_at&order=desc
```

Plus domain filters (`blood_group`, `status`, `camp_status`, `role`, …). Invalid `order_by` keys fall back to the endpoint default.

| Resource | Search (`q`) | Common filters | Sort allowlist (examples) |
|----------|--------------|----------------|---------------------------|
| Donors | name, phone | blood_group, status | name, created_at, blood_group, status |
| Units | barcode | blood_group, lifecycle_state | barcode, created_at, expiry_datetime |
| Camps | name, location | camp_status | requested_date, camp_name, status |
| Camp bookings | camp, donor, phone | status | created_at, status, camp_name, donor_name |
| Requisitions | patient, hospital id | status, blood_group, priority | requested_at, status, priority |
| Users | username, name, email | role | username, role, last_login_at |
| Organizers | org / contact | org_category, is_verified | org_name, is_verified |
| Directory | name, mobile | category | source_serial, org_name, category |

### Client-side pass

`applyClientTable` re-filters/sorts an already-loaded array (used on bookings and the approval queue after pending-status filtering).

## Dashboard stock

`/dashboard` shows:

1. **KPI strip** — linked counts (units, open requisitions, camps to review, organizers / bookings)
2. **Stock matrix** — component rows × blood-group columns, colour by scarcity
3. **SSE** — `EventSource` on `/stream/stock/{facility_id}?token=…` with REST snapshot fallback

## Design notes

- Prefer flat borders and dense rows over soft shadows / gradient icon cards
- Duplicate page titles under the shell header are avoided where possible
- Deploy the web bundle via the manual **CI / CD** workflow after UI changes
