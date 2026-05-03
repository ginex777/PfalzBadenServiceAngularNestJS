# Project Agent Instructions (PBS)

Fullstack TypeScript monorepo:
- `pbs-webapp/` Angular (web)
- `pbs-mobile/` Angular + Capacitor (mobile)
- `pbs-backend/` NestJS API
- DB: Postgres is the source of truth (see `docker-compose.yml`, `pbs-backend/prisma/schema.prisma`). `README.md` mentions SQLite in `data/` as legacy.

Hard requirements (non-negotiable)
- Backend contains ALL business logic. Frontends are UI + state only.
- Keep TypeScript strict: no `any`, no `as unknown as`, no unsafe casts to "make it compile".
- Follow existing architecture and patterns; reuse existing utilities/modules instead of inventing new ones.
- Changes must compile. Do not leave the repo with TypeScript errors in files you touched.

How to work (high-signal behavior)
- Challenge bad ideas (overengineering, wrong layer, inconsistent patterns). Be direct.
- If requirements are unclear: state assumptions (briefly) and proceed with the simplest correct option.
- No hallucinations: if anything is unclear or cannot be verified from context, ask. Prefer 5x questions over 1 wrong assumption. Be explicit about uncertainty and never invent details.
- Prefer small, atomic changes. Avoid broad refactors unless requested.
- Prefer terse, high-signal replies (mirror `.claude/CLAUDE.md`: no fluff, no restating the question).

Naming / language rule (new)
- Use **English** identifiers for code (functions, variables, services, DTOs, etc.).
- Exception: keep **Angular component names** (component class names / selectors / files) **in German** to match the app.
- Webapp templates/components: use **English** component APIs (e.g. `@Input()`/`@Output()` names and their template bindings). If you touch a component that exposes German props like `platzhalter`, translate them to English (e.g. `placeholder`) and update the component + all affected usages in the same change.
- Do not do repo-wide renames without an explicit spec (this will be a separate refactoring task).

Definition of done (practical)
- For backend changes: `npm run build --prefix pbs-backend` and relevant `npm run test --prefix pbs-backend`.
- For web changes: `npm run build --prefix pbs-webapp` and relevant `npm run test --prefix pbs-webapp`.
- For mobile changes: `npm run build --prefix pbs-mobile` (and Capacitor build steps when relevant).
- For infra/Docker changes: `docker compose build` should succeed.

Repo commands (quick)
- Dev: `npm run start:backend`, `npm run start:frontend`
- Build: `npm run build:backend`, `npm run build:frontend`
- Docker: `docker compose up -d`, `docker compose build`

Environment
- Windows-only local dev (PowerShell). Avoid bash-only instructions.
- Allowed automation: `npm install` and Prisma migrations when needed.

Codex setup
- Repo-scoped Codex skills live in `.agents/skills/` per current Codex docs.
- Use `$caveman` when the user asks for terse/direct output.
- Use `$angular-developer` for Angular best practices in `pbs-webapp/` or `pbs-mobile/`.
- Use `$pbs-backend` for `pbs-backend/`, Prisma, auth, DTOs, and backend-owned business logic.
- Use `$pbs-frontend` plus `$frontend-design` and `$frontend-refactor` for `pbs-webapp/` or `pbs-mobile/` UI/component/template/style work.
- Use `$pbs-security` for security reviews, threat models, auth hardening, upload risks, and production security checks.
- Use `$pbs-docs-workflow` for specs, roadmap docs, decision logs, audits, and TODO files.
- Use `$pbs-review-audit` for comprehensive reviews and action-list generation.
- Use OpenAI developer documentation MCP only when working with OpenAI API, ChatGPT Apps SDK, Codex, plugins, skills, or model guidance.

Recommended external Codex skills
- Angular official skills repo: `https://github.com/angular/skills`.
- Caveman source repo: `https://github.com/JuliusBrussee/caveman`.
- OpenAI skills catalog: `https://github.com/openai/skills`.
- `angular-developer` is useful and mirrored repo-locally with PBS overrides.
- `angular-new-app` is not installed because this monorepo already exists; use it only when creating a new Angular app from scratch.
- `security-threat-model` from OpenAI curated skills is useful for formal AppSec reports.
- `gh-address-comments` is useful only if GitHub CLI (`gh`) is authenticated and PR review handling is needed.
- Do not add broad third-party skill packs unless a workflow needs them; repo-local PBS skills stay source of truth.

Docs workflow
- Roadmap index: `docs/master-plan.md` (links only).
- Specs: `docs/specs/{backlog,active,done}/*.md` (one file per task).
- Decisions: append-only `docs/decisions.md`.
- Baseline audit: do not edit `docs/project-audit.md` unless explicitly asked.
