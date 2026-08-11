---
id: stock-dashboard
title: Stock Dashboard
---

# Stock Dashboard

## Overview

`/dashboard` is role-aware:

| Role | Content |
|------|---------|
| Staff (`superadmin`, `district_admin`, `doctor`) | KPI strip + live stock matrix for the user’s facility |
| Organizer | Camp status counts + recent applications table |
| Citizen | Link through to `/my-account` |

Staff stock uses two sources:

1. **REST** — `useAuthenticatedStock(facilityId)` snapshot
2. **SSE** — `EventSource` on `/stream/stock/{facilityId}?token=…` when connected

## KPI strip

Flat 4-cell strip (not floating SaaS cards), each cell links into the matching queue:

- Blood units → `/units`
- Open requisitions → `/requisitions`
- Camps to review → `/camps/approval`
- Organizer accounts / booking queue → `/organizers` or `/camps/bookings`

## Stock matrix

One table per loaded component type set:

- **Rows** = component types (PRBC, Platelets, FFP, …)
- **Columns** = blood groups (A+ … O-)
- **Cells** = available count (red = 0, amber = low)

Implementation: `web/src/routes/dashboard/index.tsx`.

## SSE wiring

```typescript
const token = localStorage.getItem("access_token");
const apiBase = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";
const url = `${apiBase}/stream/stock/${facilityId}?token=${encodeURIComponent(token)}`;
const es = new EventSource(url);
es.onmessage = (ev) => {
  const parsed = JSON.parse(ev.data);
  if (Array.isArray(parsed.entries)) setSseEntries(parsed.entries);
};
```

Panel subtitle shows “live” when SSE has delivered at least one payload; otherwise the REST snapshot time.

## Public stock page

`/public/stock` — no authentication. Uses `usePublicStock()` with a slower poll. Totals by blood group for the public hospital portal.

## Related

- [Staff UI & Tables](./staff-ui.md)
- [Stock API](../api/stock.md)
