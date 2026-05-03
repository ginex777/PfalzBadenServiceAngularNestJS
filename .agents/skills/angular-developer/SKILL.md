---
name: angular-developer
description: Official Angular-style development guidance adapted for PBS. Use for Angular components, services, routing, forms, signals, dependency injection, accessibility, testing, CLI tooling, and Angular best practices in `pbs-webapp/` or `pbs-mobile/`.
---

# Angular Developer

Follow Angular team guidance, then apply PBS repo rules.

## Baseline

- Analyze the app Angular version before giving version-specific guidance.
- Follow Angular style guide and best practices for maintainability and performance.
- Prefer Angular CLI generation only when it fits the existing repo layout.
- Run the relevant app build after code changes.

## PBS Overrides

- Backend owns all business logic.
- Use English identifiers and component public APIs.
- Keep Angular component class names, selectors, and files in German.
- No `any`, no `as unknown as`, no unsafe casts.
- Use `$pbs-frontend`, `$frontend-design`, and `$frontend-refactor` for PBS UI work.

## Components

- Prefer standalone components.
- Keep metadata explicit and imports local.
- Use modern template control flow when consistent with the file.
- Use signal inputs/outputs only when the project version and local patterns support them.
- Preserve accessibility semantics and keyboard behavior.

## Reactivity

- Prefer `signal`, `computed`, and `effect` for UI state.
- Use `linkedSignal` and `resource` only when the project Angular version supports them and local patterns justify them.
- Avoid effects for state propagation that should be computed.

## Forms

- For new Angular 21 forms, consider signal forms if project dependencies support them.
- For existing forms, keep the current strategy unless a migration is explicitly requested.
- UI validation improves UX only; backend validation remains authoritative.

## Routing

- Prefer lazy feature routes.
- Guards protect UX only; backend authorization remains required.
- Use resolvers only when they simplify route-owned data loading.

## Testing

- Prefer tests for behavior, not implementation details.
- Use robust component interaction patterns instead of brittle DOM snapshots.
- Repair broken specs touched by the task.

## Validation

- Web: `npm run build --prefix pbs-webapp`.
- Mobile: `npm run build --prefix pbs-mobile`.
