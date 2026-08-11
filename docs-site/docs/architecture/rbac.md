---
id: rbac
title: RBAC — Roles & Permissions
---

# RBAC — Roles & Permissions

RAKT Durg uses eight roles. Every API endpoint declares which roles may access it via a `require_roles()` FastAPI dependency.

## Role Definitions

| Role | Who | Key Permissions |
|------|-----|----------------|
| `admin` | System administrator | Everything; feature flag management; e-RaktKosh export trigger |
| `medical_officer` | Doctor / MO | Approve/reject camps; review screenings; requisition management |
| `lab_tech` | Laboratory technician | Record test results; manage unit lifecycle; view stock |
| `phlebotomist` | Blood collection staff | Register donors; conduct screenings; create donations |
| `inventory_officer` | Inventory manager | Manage stock; process requisitions; issue components |
| `organizer` | Camp organiser (NGO/volunteer) | Apply for camps; manage camp events |
| `donor` | Registered blood donor | View own donation history; view wallet balance |
| `citizen_read` | Public user | View public stock page only; no authenticated API access |

## Permission Matrix

| Action | admin | medical_officer | lab_tech | phlebotomist | inventory_officer | organizer | donor | citizen_read |
|--------|-------|-----------------|----------|--------------|-------------------|-----------|-------|--------------|
| View public stock | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View authenticated stock | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Create blood unit | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Record test results | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Register donor | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Conduct screening | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Create/manage camp | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Approve/reject camp | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create requisition | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Reserve/issue components | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| Wallet credit/redeem | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Admin feature flags | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Trigger e-RaktKosh export | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

## Implementation

### Backend

```python
# app/core/security.py
from fastapi import Depends, HTTPException, status

def require_roles(allowed: list[str]):
    async def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _check

# Usage in router:
@router.post("/units")
async def create_unit(
    actor: User = Depends(require_roles(["admin","medical_officer","lab_tech","phlebotomist"]))
):
    ...
```

### Web Frontend

```typescript
// web/src/lib/rbac.ts
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  "/dashboard": ["admin","medical_officer","lab_tech","phlebotomist","inventory_officer"],
  "/units":     ["admin","medical_officer","lab_tech"],
  "/donors":    ["admin","medical_officer","lab_tech","phlebotomist"],
  "/camps":     ["admin","medical_officer","organizer"],
  "/wallet":    ["admin","medical_officer","donor"],
  "/admin":     ["admin"],
};

// ProtectedRoute component checks user.role against ROUTE_ROLES[location.pathname]
```

## Token Structure

```json
{
  "sub": "user-uuid",
  "role": "lab_tech",
  "facility_id": "facility-uuid",
  "exp": 1700000000,
  "jti": "token-uuid"
}
```

- Access token TTL: **15 minutes**
- Refresh token TTL: **7 days**
- Refresh tokens stored as SHA-256 hash in `refresh_tokens` table; rotated on each use
- 401 response from API automatically clears tokens in the browser and redirects to `/login`
