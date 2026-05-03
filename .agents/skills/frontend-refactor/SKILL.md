---
name: frontend-refactor
description: Angular refactor and hygiene for PBS frontends. Use whenever editing Angular components, templates, styles, routing, signals state, or Ionic/Capacitor UI in `pbs-webapp/` or `pbs-mobile/` to enforce Angular 21 practices, English component APIs, and strict TypeScript.
---

# Frontend Refactor

Apply to every touched Angular UI file.

## Repo Rules

- Backend owns business logic.
- No `any`, no `as unknown as`, no unsafe casts.
- English identifiers for code and component public APIs.
- German Angular component class names, selectors, and files stay German.
- Follow nearby architecture instead of inventing new patterns.

## Angular Checklist

- Prefer standalone components.
- Prefer `inject(...)` for new/touched dependency injection.
- Use signals/computed/effect for UI state where it fits.
- Prefer `AsyncPipe` over manual subscriptions.
- If subscribing manually, use `takeUntilDestroyed()`.
- Add OnPush where feasible.
- Use stable tracking for loops.
- Keep templates readable and light.
- Use strongly typed reactive forms where forms are touched.

## Refactor Scope

- Small task: clean only touched code.
- Broken workflow: state a 3-6 bullet plan, then implement a vertical slice.
- Do not do repo-wide renames without explicit spec.

## Validation

- Web: `npm run build --prefix pbs-webapp`.
- Mobile: `npm run build --prefix pbs-mobile`.
