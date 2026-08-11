import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "doc",
      id: "intro",
      label: "Introduction",
    },
    {
      type: "doc",
      id: "demo",
      label: "Demo & Live Links",
    },
    {
      type: "doc",
      id: "quickstart",
      label: "Quick Start",
    },
    {
      type: "category",
      label: "Architecture",
      collapsed: false,
      items: [
        "architecture/overview",
        "architecture/tech-stack",
        "architecture/data-model",
        "architecture/rbac",
        "architecture/offline-sync",
        "architecture/adr",
      ],
    },
    {
      type: "category",
      label: "Implementation Phases",
      collapsed: false,
      items: [
        "phases/phase-0",
        "phases/phase-1",
        "phases/phase-2",
        "phases/phase-3",
        "phases/phase-4",
        "phases/phase-5",
      ],
    },
    {
      type: "category",
      label: "Backend Guide",
      items: [
        "backend/setup",
        "backend/auth",
        "backend/blood-units",
        "backend/donors",
        "backend/camps",
        "backend/wallet",
        "backend/requisitions",
        "backend/notifications",
        "backend/tasks",
        "backend/testing",
      ],
    },
    {
      type: "category",
      label: "API Reference",
      items: [
        "api/overview",
        "api/auth",
        "api/units",
        "api/stock",
        "api/donors",
        "api/sync",
        "api/camps",
        "api/wallet",
        "api/requisitions",
        "api/admin",
      ],
    },
    {
      type: "category",
      label: "Web (React)",
      items: [
        "web/setup",
        "web/auth-context",
        "web/rbac",
        "web/stock-dashboard",
      ],
    },
    {
      type: "category",
      label: "Mobile (Flutter)",
      items: [
        "mobile/setup",
        "mobile/offline-screening",
        "mobile/sync",
        "mobile/barcode",
      ],
    },
    {
      type: "category",
      label: "Operations",
      items: [
        "ops/docker",
        "ops/makefile",
        "ops/ci-cd",
        "ops/seeds",
        "ops/migrations",
      ],
    },
    {
      type: "category",
      label: "Compliance",
      items: [
        "compliance/dpdp",
        "compliance/nbtc",
      ],
    },
  ],
};

export default sidebars;
