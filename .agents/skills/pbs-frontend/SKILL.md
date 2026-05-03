---
name: pbs-frontend
description: PBS Angular frontend engineering for `pbs-webapp/` and `pbs-mobile/`: Angular components, templates, SCSS, signals state, Ionic/Capacitor UI, routing, accessibility, responsive behavior, and frontend-only state. Use whenever a task touches PBS frontend code.
---

# PBS Frontend

Use this together with `$angular-developer`, `$frontend-design`, and `$frontend-refactor` when touching UI, components, templates, or styles.

## Stack

- Angular 21
- Standalone components
- Signals
- SCSS
- Ionic + Capacitor for `pbs-mobile/`

## Boundaries

- Frontend is UI plus state only.
- Backend owns business logic, validation authority, and operational decisions.
- Services call APIs; components do not invent backend rules.

## Rules

- Keep Angular component class names, selectors, and files in German.
- Use English identifiers for services, variables, functions, DTOs, inputs, outputs, and public component APIs.
- If touching a German `@Input()`/`@Output()`, translate it and update all usages in the same change.
- Prefer `inject(...)` in new/touched code unless local style clearly differs.
- Prefer signals/computed/effect for UI state.
- Avoid manual `subscribe()` in components; if needed, use `takeUntilDestroyed()`.
- Add `ChangeDetectionStrategy.OnPush` where feasible for touched components.
- Ensure `@for`/`*ngFor` has stable tracking.
- Keep templates light; move formatting to UI helpers/pipes only when it is not business logic.

## UX Baseline

- WCAG AA where practical.
- Keyboard support for interactive elements.
- Touch targets at least 36px on mobile.
- Empty, loading, error, disabled, and success states where the workflow needs them.
- Reuse existing tokens and visual language before adding new styles.

## Validation

- Web: `npm run build --prefix pbs-webapp` and relevant tests.
- Mobile: `npm run build --prefix pbs-mobile`; run tests when the test runner is relevant/fixed.
