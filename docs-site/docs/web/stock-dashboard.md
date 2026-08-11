---
id: stock-dashboard
title: Stock Dashboard
---

# Stock Dashboard

## Overview

The dashboard at `/dashboard` shows real-time blood component availability. It uses two data sources:

1. **SSE stream** — primary, updates within ~1 second of any stock change
2. **TanStack Query** — fallback, polls every 30 seconds if SSE disconnects

## SSE Integration

```typescript
// web/src/routes/dashboard/index.tsx
useEffect(() => {
  const token = localStorage.getItem("access_token");
  const url = `${import.meta.env.VITE_API_URL}/stream/stock/${facilityId}`;
  const es = new EventSource(`${url}?token=${token}`);

  es.onmessage = (event) => {
    const update = JSON.parse(event.data);
    setLiveData((prev) => mergeStockUpdate(prev, update));
  };

  es.onerror = () => {
    // SSE disconnected — TanStack Query fallback kicks in
    es.close();
  };

  return () => es.close();
}, [facilityId]);
```

## TanStack Query Fallback

```typescript
const { data: queryData } = useAuthenticatedStock(facilityId);
// refetchInterval: 30_000

// Merge: SSE data takes precedence when available
const stockData = liveData ?? queryData;
```

## Grid Display

The dashboard renders a grid:
- **Rows** = component types (Whole Blood, Packed RBC, Plasma, Platelets, Cryo)
- **Columns** = blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-)
- **Cells** = available count, colour-coded by `bloodGroupColor()`

```typescript
// web/src/lib/utils.ts
export function bloodGroupColor(group: string): string {
  const map: Record<string, string> = {
    "A+": "bg-blue-100 text-blue-800",
    "A-": "bg-blue-200 text-blue-900",
    "B+": "bg-green-100 text-green-800",
    "B-": "bg-green-200 text-green-900",
    "AB+": "bg-purple-100 text-purple-800",
    "AB-": "bg-purple-200 text-purple-900",
    "O+": "bg-red-100 text-red-800",
    "O-": "bg-red-200 text-red-900",
  };
  return map[group] ?? "bg-gray-100 text-gray-800";
}
```

## Public Stock Page

`/public/stock` — no authentication required. Used by the public-facing hospital portal.

```typescript
// Uses usePublicStock() hook
// refetchInterval: 60_000
// Shows totals by blood group (no component breakdown)
```

## Connection Status Indicator

The dashboard shows a status chip:
- Green pulsing dot — SSE connected
- Yellow dot — using polling fallback
- Red dot — no data

```typescript
const connectionStatus = sseConnected ? "live" : "polling";
```
