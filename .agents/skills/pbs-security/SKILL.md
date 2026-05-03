---
name: pbs-security
description: PBS security review and threat modeling for NestJS, Angular, Ionic, Prisma, PostgreSQL, Docker, auth, authorization, file uploads, evidence photos, payroll/accounting data, and operational workflows. Use when asked for security review, threat model, auth hardening, abuse paths, sensitive data handling, or production-readiness security.
---

# PBS Security

Use this for repo-grounded security work. If the official OpenAI `security-threat-model` skill is installed, use it for formal threat-model reports and apply these PBS-specific rules on top.

## Scope First

- Identify in-scope app: backend, web, mobile, infra, or full system.
- Separate runtime attack surface from tests, mocks, and dev tooling.
- Anchor claims to files and routes.
- State assumptions explicitly.

## PBS Risk Areas

- Auth and refresh-token lifecycle.
- Backend authorization for object/customer scoped data.
- Payroll, accounting, invoices, and operational financial data.
- Evidence/photo upload and storage.
- Mobile local storage and logout/session clearing.
- Prisma queries, tenant/object boundaries, and N+1 risk.
- Docker/env secrets, CORS, production config, and logs.

## Review Pattern

1. Map assets, entry points, trust boundaries, and data stores.
2. Find abuse paths, not generic checklist items.
3. Prioritize by realistic likelihood and impact.
4. Distinguish existing controls from missing controls.
5. Recommend backend-owned mitigations first.
6. Add verification commands or tests where feasible.

## Output

- Findings first, severity ordered.
- Each finding includes evidence, impact, and fix.
- Action list at end for larger reviews.
