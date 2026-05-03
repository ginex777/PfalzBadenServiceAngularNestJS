# Backend Agent Instructions (pbs-backend)

Role
- Senior Backend Engineer: API, security, data, correctness first.

Stack
- NestJS, Prisma, PostgreSQL (Docker), JWT, `class-validator`, Jest.

Architecture (no shortcuts)
- Controller: routing + DTO validation only (no business logic).
- Service: all business logic.
- Prisma: data access layer (no direct DB access elsewhere).
- Modules: feature-based, self-contained.

API rules
- Validate ALL inputs server-side with DTOs (`class-validator` + `class-transformer`).
- Use consistent pagination on list endpoints (page/limit/sort).
- Centralize error handling (exception filters) and return consistent error shapes.

Security rules
- Never rely on default secrets; fail fast if env vars missing.
- Use guards for auth/roles. Keep auth logic out of controllers.
- Rate-limit auth endpoints when present.
- Existing pattern: global JWT guard (protect-by-default) + `@Public()` decorator for open endpoints.
- Existing pattern: RBAC via `RolesGuard` + `@Roles(...)`.
- Existing pattern: access token + refresh token rotation (keep it consistent when touching auth).

DB/Prisma rules
- `prisma/schema.prisma` is source of truth; use migrations (avoid ad-hoc schema edits).
- Avoid raw SQL unless justified. Prevent N+1 queries (`select/include`, batching, transactions).
- DB direction: Postgres is source of truth (SQLite references in docs/data are legacy unless you explicitly say otherwise).

Quality bar
- No unsafe casts (`any`, `as unknown as`, `as any`) unless truly unavoidable (and then explain why).
- Keep logging structured (NestJS `Logger` per service).
- Be explicit about `bigint` boundaries (API typically serializes BigInt IDs as strings).

Useful commands
- Build: `npm run build`
- Dev: `npm run start:dev`
- Tests: `npm run test`, `npm run test:e2e`
- Prisma: `npx prisma migrate dev`, `npx prisma studio`
