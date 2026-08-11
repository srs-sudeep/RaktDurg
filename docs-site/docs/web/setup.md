---
id: setup
title: Web Setup
---

# Web Frontend Setup

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Bun | 1.1.34 | Package manager + runtime |
| React | 18 | UI framework |
| Vite | 5 | Build tool + dev server |
| TanStack Query | v5 | Server state management |
| shadcn/ui | latest | Accessible component library |
| Tailwind CSS | v3 | Utility-first styling |
| React Router | v6 | Client-side routing |
| Axios | latest | HTTP client |
| Vitest | latest | Unit testing |

## Project Layout

```
web/
├── src/
│   ├── api/
│   │   ├── client.ts        # axios instance + interceptors
│   │   └── stock.ts         # TanStack Query hooks for stock
│   ├── components/
│   │   └── ProtectedRoute.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── rbac.ts          # roles + ROUTE_ROLES + canAccess()
│   │   └── utils.ts         # cn(), formatDate(), bloodGroupColor()
│   ├── routes/
│   │   ├── auth/login.tsx
│   │   ├── dashboard/index.tsx   # SSE stock dashboard
│   │   ├── public/stock.tsx      # unauthenticated stock view
│   │   └── index.tsx             # router config
│   ├── __tests__/
│   │   ├── setup.ts
│   │   └── App.test.tsx
│   └── main.tsx
├── package.json              # packageManager: bun@1.1.34
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── eslint.config.js
```

## Getting Started

```bash
cd web
bun install
bun run dev        # http://localhost:3000
```

Or via Make:
```bash
make web-install
make web-dev
```

## Environment Variables

Create `web/.env`:
```bash
VITE_API_URL=http://localhost:8000
```

## Build

```bash
bun run build
# Output: web/dist/
```

## Testing

```bash
bun run test           # vitest run
bun run test:watch     # vitest watch mode
bun run test:coverage  # v8 coverage report
```

## Linting & Type Check

```bash
bun run lint           # eslint
bun run type-check     # tsc --noEmit
```
