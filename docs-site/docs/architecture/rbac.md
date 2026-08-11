---
id: rbac
title: RBAC — Roles & Permissions
---

# RBAC — Roles & Permissions

RAKT Durg uses **five roles**. Every API endpoint declares which roles may access it via a `require_roles()` FastAPI dependency. Web and mobile both authenticate with the same JWT; **clients then show different homes / menus by role**.

## Client access (web vs mobile)

| Role | Can log in (web) | Can log in (mobile) | Primary experience |
|------|:----------------:|:-------------------:|--------------------|
| `superadmin` | ✓ | ✓ | Staff web + mobile field tools |
| `district_admin` | ✓ | ✓ | Staff web + mobile field tools |
| `doctor` | ✓ | ✓ | Staff web + mobile field tools |
| `organizer` | ✓ | ✓ | **Web** camp apply; mobile UI exists but clinical APIs (donor/screening/sync) are **not** for organizers |
| `citizen` | ✓ | ✓ | Citizen web portal + mobile citizen home |

Details and demo usernames: [Demo & Live Links](../demo.md#who-can-sign-in-where).

## Role Definitions

| Role | Who | Key Permissions |
|------|-----|----------------|
| `superadmin` | System administrator | All facilities, feature flags, e-RaktKosh export, full API |
| `district_admin` | Facility operations staff | Units, donors, screenings, stock, barcodes, sync, camps, requisitions |
| `doctor` | Medical officer | Camp approval, clinical requisitions, wallet oversight |
| `organizer` | Camp organiser (NGO/volunteer) | Apply for camps; manage own camp events |
| `citizen` | Public / donor user | Public stock; wallet when linked as a registered donor |

Former roles merged: `lab_tech`, `phlebotomist`, and `inventory_officer` → **`district_admin`**; `donor` and `citizen_read` → **`citizen`**.

## Permission Matrix

| Action | superadmin | district_admin | doctor | organizer | citizen |
|--------|------------|----------------|--------|-----------|---------|
| View public stock | ✓ | ✓ | ✓ | ✓ | ✓ |
| View authenticated stock | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create blood unit | ✓ | ✓ | ✓ | ✗ | ✗ |
| Record test results | ✓ | ✓ | ✓ | ✗ | ✗ |
| Register donor / screening | ✓ | ✓ | ✓ | ✗ | ✗ |
| Barcode pre-allocate / sync | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create/manage camp (apply) | ✓ | ✗ | ✗ | ✓ | ✗ |
| Approve/reject camp | ✓ | ✗ | ✓ | ✗ | ✗ |
| Requisitions | ✓ | ✓ | ✓ | ✗ | ✗ |
| Wallet | ✓ | ✓ | ✓ | ✗ | ✓ |
| Admin feature flags | ✓ | ✗ | ✗ | ✗ | ✗ |

## Implementation

### Backend

```python
from app.middleware.rbac import require_roles
from app.models.enums import UserRoleEnum

@router.post("/units")
async def create_unit(
    actor: User = Depends(require_roles(
        UserRoleEnum.SUPERADMIN,
        UserRoleEnum.DISTRICT_ADMIN,
        UserRoleEnum.DOCTOR,
    )),
):
    ...
```

### Web Frontend

See [`web/src/lib/rbac.ts`](../../../web/src/lib/rbac.ts) for `ROUTE_ROLES` and `canAccess()`, and [Web RBAC](../web/rbac.md).

### Mobile

`mobile/lib/main.dart` routes:

- Field roles `{superadmin, district_admin, doctor, organizer}` → field dashboard
- Everyone else (citizen) → citizen home

Clinical endpoints used by field tools still enforce API RBAC (organizer gets 403 on donor/sync).

## Token Structure

```json
{
  "sub": "user-uuid",
  "role": "district_admin",
  "facility_id": "facility-uuid",
  "exp": 1700000000
}
```

- Access token TTL: **15 minutes**
- Refresh token TTL: **7 days**
- Refresh tokens stored as SHA-256 hash in `refresh_tokens` table; rotated on each use
