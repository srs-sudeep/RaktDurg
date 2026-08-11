---
id: setup
title: Web Setup
---

# Web Frontend Setup

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Bun | 1.1+ | Package manager + runtime |
| React | 18 | UI framework |
| Vite | 5 | Build tool + dev server |
| TanStack Query | v5 | Server state management |
| Tailwind CSS | v3 | Utility-first styling |
| React Router | v6 | Client-side routing |
| Axios | latest | HTTP client |
| Vitest | latest | Unit testing |

## Project Layout

```
web/
├── src/
│   ├── api/                 # Axios + TanStack Query hooks
│   ├── components/
│   │   ├── AppLayout.tsx    # Staff shell
│   │   ├── ui/              # DataTable, toolbar, panel, form, button
│   │   └── ProtectedRoute.tsx
│   ├── context/AuthContext.tsx
│   ├── lib/
│   │   ├── rbac.ts
│   │   ├── page-meta.ts
│   │   ├── table-query.ts   # useTableQuery / applyClientTable
│   │   ├── toast.ts
│   │   └── utils.ts
│   ├── routes/              # dashboard, donors, units, camps, …
│   └── main.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.ts
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

Create `web/.env` for local API:

```bash
VITE_API_URL=http://localhost:8000
```

Production builds use an empty `VITE_API_URL` so the browser calls same-origin nginx (`/auth`, `/donors`, …).

## Build

```bash
bun run build
# Output: web/dist/
```

## Testing / quality

```bash
bun run test
bun run type-check
bun run lint
```

## Docs to read next

- [Staff UI & Tables](./staff-ui.md) — ERP shell, search/sort/pagination
- [Stock Dashboard](./stock-dashboard.md) — KPI + SSE matrix
- [Web RBAC](./rbac.md) — route gates
