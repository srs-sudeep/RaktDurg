---
id: auth-context
title: Auth Context
---

# Auth Context

## AuthProvider

`web/src/context/AuthContext.tsx` provides authentication state to the entire app.

```typescript
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthUser {
  sub: string;                 // user UUID
  role: UserRole;
  facility_id: string | null;
}
```

Demo logins: `superadmin` / `super123` (and other named personas) — see [Demo & Live Links](../demo.md).

## Login Flow

```typescript
const login = async (username: string, password: string) => {
  const { data } = await apiClient.post("/auth/token", { username, password });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  const payload = jwtDecode<JWTPayload>(data.access_token);
  setUser({ sub: payload.sub, role: payload.role, facility_id: payload.facility_id });
};
```

The API expects JSON `{"username","password"}` (not form-urlencoded, not email).

## Logout Flow

```typescript
const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  if (refreshToken) {
    await apiClient.post("/auth/logout", { refresh_token: refreshToken });
  }
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  setUser(null);
};
```

## Token Rehydration

On app mount, the provider checks localStorage for an existing token and restores the session:

```typescript
useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (token) {
    try {
      const payload = jwtDecode<JWTPayload>(token);
      if (payload.exp * 1000 > Date.now()) {
        setUser({ sub: payload.sub, role: payload.role, facility_id: payload.facility_id });
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      }
    } catch {
      localStorage.removeItem("access_token");
    }
  }
}, []);
```

## Axios Interceptors

`web/src/api/client.ts` attaches the token automatically and treats failed login/refresh separately from session expiry (so a bad password does not hard-reload `/login`).

```typescript
// Request interceptor — attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

## Usage

```typescript
import { useAuth } from "@/context/AuthContext";

function MyComponent() {
  const { user, logout } = useAuth();

  return (
    <div>
      <p>Logged in as: {user?.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```
