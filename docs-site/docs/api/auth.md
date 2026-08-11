---
id: auth
title: Auth API
---

# Auth API

## POST /auth/token

Login. Returns access and refresh tokens.

**Request** (JSON):
```json
{"username": "admin", "password": "admin123"}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

---

## POST /auth/refresh

Exchange a refresh token for a new access+refresh token pair.

**Request:**
```json
{"refresh_token": "eyJhbGciOiJIUzI1NiJ9..."}
```

**Response:** Same as `/auth/token`.

**Note:** The old refresh token is invalidated immediately.

---

## POST /auth/logout

Revoke a refresh token.

**Request:**
```json
{"refresh_token": "eyJhbGciOiJIUzI1NiJ9..."}
```

**Response:** `204 No Content`
