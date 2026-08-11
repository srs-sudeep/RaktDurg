---
id: auth-context
title: Auth Context
---

# Auth Context

## AuthProvider

`web/src/context/AuthContext.tsx` provides authentication state to the entire app.

```typescript
interface AuthContextType {
  user: JWTPayload | null;  // decoded token payload
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface JWTPayload {
  sub: string;          // user UUID
  role: UserRole;
  facility_id: string | null;
  exp: number;
}
```

## Login Flow

```typescript
const login = async (email: string, password: string) => {
  const params = new URLSearchParams({ username: email, password });
  const { data } = await apiClient.post("/auth/token", params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  const payload = jwtDecode<JWTPayload>(data.access_token);
  setUser(payload);
};
```

Note: The API expects `username` (not `email`) in the form body — this is the OAuth2 password flow convention that FastAPI uses.

## Logout Flow

```typescript
const logout = async () => {
  const refreshToken = localStorage.getItem("refresh_token");
  await apiClient.post("/auth/logout", { refresh_token: refreshToken });
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
        setUser(payload);
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

`web/src/api/client.ts` attaches the token automatically:

```typescript
// Request interceptor — attach Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
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
