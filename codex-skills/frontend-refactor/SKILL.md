---
name: frontend-refactor
description: Refactor and hygiene for PBS Angular frontends. Use whenever you edit Angular components/templates/styles in `pbs-webapp/` or `pbs-mobile/` to enforce English component APIs (keep component class/selector/files in German), align changes with Angular 21 best practices, and ensure touched files compile with strict TypeScript. Not for backend/API/DB tasks.
---

# Frontend Refactor (PBS / Angular 21)

Use this whenever you touch an Angular component in `pbs-webapp/` or `pbs-mobile/` to keep the codebase consistent, English-API, and aligned with Angular 21 best practices.

## Workflow-first refactors (allowed)

- If the existing UX/workflow is clearly suboptimal, refactor beyond “code cleanup”:
  - restructure component composition (smart/dumb split),
  - improve state boundaries (facades/signals),
  - simplify user flows (fewer steps, clearer states).
- Keep it safe: do not introduce new architecture patterns unless needed; prefer the existing feature structure and conventions.
- If the change is large, start by stating a short plan (3–6 bullets) and then execute it.

## Repo rules (must follow)

- Backend holds business logic (frontend is UI + state only).
- Strict TypeScript: no `any`, no `as unknown as`, no unsafe casts.
- Identifiers in English (services, variables, methods, DTOs, etc.).
- Angular component names stay German (class name, selector, filenames).
- Component public API is English:
  - Translate German `@Input()`/`@Output()` names + template bindings to English when you touch the component, and update all usages in the same change.

## Refactor checklist (apply to touched code)

### Angular 21 best practices

- Prefer standalone components and `imports: []` (unless the codebase intentionally uses NgModules in that area).
- Use `ChangeDetectionStrategy.OnPush` for presentational components where feasible.
- Prefer `inject(...)` over constructor injection for new/updated code (unless existing pattern in that folder is constructor-based).
- Prefer `AsyncPipe` over manual subscriptions; avoid `subscribe()` in components for UI state unless necessary.
- If you must subscribe: use `takeUntilDestroyed()` (and keep cleanup correct).
- Prefer the new template control flow (`@if`, `@for`, `@switch`) when the surrounding code already uses it; otherwise keep style consistent within the file.
- Ensure `@for` has stable tracking (`track ...`) or `ngForTrackBy` equivalent if applicable.
- Avoid heavy logic in templates; move formatting to pure helpers/pipes (frontend-only) or request backend changes for business rules.

### Component API hygiene

- Keep inputs/outputs minimal, typed, and named by intent (English).
- Avoid leaking internal model shapes into templates; map to view models in the component when it improves clarity (still UI-level).
- Keep `@Input()` immutable by default; avoid mutating input objects.

### Forms

- Prefer strongly typed reactive forms where applicable.
- Validate in the UI only for UX; do not duplicate backend business validation rules.

### Accessibility & UX

- Keep semantic HTML and label associations.
- Preserve keyboard/focus behavior; no click-only interactions without keyboard access.
- Ensure touch targets remain usable in mobile/Ionic.

## Validation (definition of done)

- Webapp: `npm run build --prefix pbs-webapp` (+ relevant tests if changed).
- Mobile: `npm run build --prefix pbs-mobile`.
