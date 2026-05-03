---
name: pbs-backend
description: PBS backend engineering for NestJS, Prisma, PostgreSQL, auth, DTO validation, controllers, services, database queries, migrations, guards, and backend-owned business logic. Use for any task touching `pbs-backend/`, Prisma schema, REST contracts, or server-side rules.
---

# PBS Backend

Backend owns all business logic. Frontends consume server state and submit user intent.

## Stack

- NestJS
- Prisma
- PostgreSQL
- JWT auth
- class-validator DTOs

## Architecture

- Controller: routing, guards, request/response shape only.
- Service: business logic, transactions, authorization decisions, domain rules.
- Prisma: data access through existing Prisma service/layer.
- DTO: validate every external input.
- REST API is the only runtime contract with web/mobile.

## Rules

- No business logic in controllers.
- No direct DB access outside existing Prisma patterns.
- No `any`, no `as unknown as`, no unsafe casts.
- No default secrets; fail fast if required config is missing.
- Use pagination for list endpoints unless an existing route intentionally differs.
- Use transactions for multi-step writes.
- Prevent N+1 queries with explicit `select`/`include`.
- Keep IDs consistent with the current API contract.

## Security Defaults

- Validate input server-side even if frontend validates.
- Enforce authZ in backend, never in UI only.
- Keep production CORS explicit.
- Do not expose secrets or raw internal errors.
- Prefer structured NestJS logging for meaningful service events.

## Validation

- Run `npm run build --prefix pbs-backend`.
- Run relevant `npm run test --prefix pbs-backend`.
- If Prisma schema changed, run Prisma generation/migration steps required by the task.
