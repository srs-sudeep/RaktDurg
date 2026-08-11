---
id: auth
title: Authentication
---

# Authentication

## Token Flow

```
POST /auth/token (login, JSON body)
     ↓
Returns: { access_token, refresh_token, token_type: "bearer", expires_in }
     ↓
Store both in secure storage / localStorage
     ↓
Include access_token in Authorization: Bearer <token> header
     ↓
Access token expires in 15 minutes
     ↓
POST /auth/refresh with refresh_token
     ↓
Returns new access_token + new refresh_token (rotation)
     ↓
Old refresh_token is invalidated
```

## Login

```http
POST /auth/token
Content-Type: application/json

{"username":"superadmin","password":"super123"}
```

Demo credentials (production + `make demo-seed`): see [Demo & Live Links](../demo.md).

Response:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "…",
  "token_type": "bearer",
  "expires_in": 900
}
```

## Access Token Payload

```json
{
  "sub": "user-uuid",
  "role": "superadmin",
  "facility_id": "facility-uuid",
  "type": "access",
  "exp": 1700000900,
  "iat": 1700000000
}
```

Roles: `superadmin`, `district_admin`, `doctor`, `organizer`, `citizen`.

## Refresh Token Rotation

Refresh tokens are:
1. Stored as SHA-256 hash in `refresh_tokens` table
2. Invalidated (deleted) after each use
3. A new pair is issued on every refresh

This means if a refresh token is stolen and used, the legitimate user's next refresh attempt will fail (the old token is gone).

```http
POST /auth/refresh
Content-Type: application/json

{"refresh_token": "…"}
```

## Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
Content-Type: application/json

{"refresh_token": "…"}
```

Deletes the refresh token from the database. The access token continues to work until it expires (15 minutes max).

## RBAC Dependency

```python
# app/core/security.py

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    user = await db.get(User, payload["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401)
    return user

def require_roles(allowed: list[str]):
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _check
```

## Web Auth Context

```typescript
// web/src/context/AuthContext.tsx

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// login() POSTs JSON { username, password } to /auth/token
// Stores tokens in localStorage
// Decodes JWT with jwt-decode for role/facility_id
// logout() calls POST /auth/logout and clears localStorage
```

The axios interceptor in `web/src/api/client.ts` automatically:
- Attaches `Authorization: Bearer <token>` to all requests
- Clears tokens and redirects to `/login` on session-expiry 401s (not on failed login)

## Flutter Auth

```dart
// mobile/lib/features/auth/auth_notifier.dart
// Tokens stored in flutter_secure_storage (OS keychain/keystore)
// JSON login body: { username, password } → POST /auth/token
// Rehydrated on app launch via _rehydrate()
```
