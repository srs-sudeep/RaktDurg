---
id: adr
title: Architecture Decision Records
---

# Architecture Decision Records

## ADR-001: Flutter over React Native for Mobile

**Decision**: Use Flutter 3 instead of React Native.

**Context**: Need offline-first barcode scanning + sqflite for local persistence. Team has more Dart exposure.

**Consequences**: Single codebase for Android/iOS. Riverpod provides clean state management. No JS bridge latency for barcode scanning.

---

## ADR-002: SSE over WebSockets for Stock Streaming

**Decision**: Server-Sent Events (SSE) for real-time stock updates, not WebSockets.

**Context**: Stock updates are server-push only. No need for bi-directional communication.

**Consequences**: Simpler server implementation (no upgrade handshake). Automatic reconnection by browser. Redis pub/sub as fanout mechanism means any API replica can serve the stream. HTTP/1.1 limited to 6 concurrent SSE connections per browser — acceptable for staff use.

---

## ADR-003: Append-Only Audit Log via PostgreSQL RULE

**Decision**: Protect `audit_logs` with a PostgreSQL RULE rather than application-level checks.

**Context**: Audit integrity is a compliance requirement. Application bugs could accidentally update audit records.

**Consequences**: Even a compromised API process cannot update audit records. Database admin access required for any audit record changes (which itself would be logged at the OS level).

---

## ADR-004: Wallet Behind Feature Flag

**Decision**: Blood credit wallet ships in code (Phase 4) but is disabled in production via `feature_flags` table until legal/operational sign-off.

**Context**: Wallet involves financial-adjacent functionality (credits, family redemption). Needs regulatory review before activation.

**Consequences**: Code is deployed and tested in staging. Activation is a single SQL update. All wallet routes return HTTP 503 when the flag is off.

---

## ADR-005: ABHA Reference Not Raw ID

**Decision**: Store only a masked ABHA reference, never the raw 14-digit ABHA number.

**Context**: DPDP Act 2023 and NBTC guidelines prohibit storage of raw national identity numbers.

**Consequences**: `donors.abha_reference` is a nullable, masked string like `ABHA-XXXX-XXXX-1234`. Verification calls the `ABHA.verify()` adapter (mocked in dev, real in production).

---

## ADR-006: Bun as Package Manager for Web

**Decision**: Use Bun instead of npm/yarn/pnpm for the web frontend.

**Context**: Bun is significantly faster at install and test execution. Project tooling is modern-first.

**Consequences**: `bun install`, `bun run`, `bun test` replace npm equivalents. `packageManager` field in `package.json` enforces version. CI uses `oven-sh/setup-bun` action.

---

## ADR-007: FEFO via SELECT FOR UPDATE SKIP LOCKED

**Decision**: Implement FEFO reservation at the database level using `SELECT … FOR UPDATE SKIP LOCKED` rather than application-level locking.

**Context**: Two concurrent reservation requests must not pick the same component.

**Consequences**: The database handles concurrency correctly. Components locked by one transaction are simply skipped by the next, which picks the next-earliest-expiry component. No distributed lock manager needed.

---

## ADR-008: No Email Notification Channel

**Decision**: Notifications support `whatsapp`, `sms`, and `in_app` only — no email.

**Context**: Target donors are in rural areas. WhatsApp and SMS have much higher reach than email. Email adds SMTP complexity for minimal benefit.

**Consequences**: `NotificationChannelEnum` has 3 values. No SMTP configuration required.
