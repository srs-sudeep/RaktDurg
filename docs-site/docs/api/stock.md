---
id: stock
title: Stock API
---

# Stock API

## GET /stock/\{facility_id\}

Authenticated stock summary for a facility.

**Roles:** admin, medical_officer, lab_tech, phlebotomist, inventory_officer

**Response:**
```json
{
  "facility_id": "uuid",
  "summary": [
    {
      "blood_group": "O+",
      "component_type": "packed_rbc",
      "available_count": 12,
      "oldest_expiry": "2024-01-20T00:00:00Z"
    }
  ],
  "as_of": "2024-01-15T10:30:00Z"
}
```

---

## GET /public/stock/\{facility_id\}

Public stock availability — no authentication required.

**Response:** Same structure as above, but limited to `blood_group` totals.

---

## GET /stream/stock/\{facility_id\}

Server-Sent Events stream for real-time stock updates.

**Roles:** Authenticated staff

**Headers:**
```
Accept: text/event-stream
Authorization: Bearer <token>
```

**Event format:**
```
event: stock_update
data: {"facility_id": "uuid", "blood_group": "O+", "component_type": "packed_rbc", "available_count": 12}

: keepalive (every 30 seconds)
```

The stream remains open. Reconnects automatically on disconnect.

**Implementation:** FastAPI async generator subscribes to Redis `stock:updates` pub/sub channel. Any ledger write triggers a publish.
