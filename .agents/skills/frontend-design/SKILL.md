---
name: frontend-design
description: Production-grade UI/UX design and visual polish for PBS Angular frontends. Use whenever a task touches UI in `pbs-webapp/` or `pbs-mobile/`, including small component changes, to keep the result cohesive, accessible, responsive, and not generic. Do not use for backend/API/DB-only work.
---

# Frontend Design

Create intentional PBS interfaces. Reuse existing tokens and patterns first.

## Non-Negotiables

- Backend owns business logic.
- Keep strict TypeScript.
- Component APIs are English.
- Angular component class/selector/files stay German.
- Keep touched UI compiling.

## Workflow

1. Inspect existing global styles and nearby components.
2. Pick a clear UI hierarchy and interaction flow.
3. Polish touched UI proportionally: spacing, type, alignment, focus, hover, disabled, loading, empty, and error states.
4. Preserve semantics, keyboard behavior, contrast, and responsive layout.
5. Validate with the relevant app build.

## Webapp

- Use tokens in `pbs-webapp/src/styles.scss`.
- Prefer SCSS and CSS variables.
- Avoid new font stacks or new design systems unless explicitly requested.

## Mobile

- Prefer Ionic components/theming.
- Use tokens in `pbs-mobile/src/styles.scss`.
- Respect safe areas, touch targets, and small-screen density.

## Avoid

- Generic landing-page composition for operational tools.
- Random gradients, decorative blobs, inconsistent radii, and unmotivated shadows.
- Visible text explaining UI mechanics unless the workflow truly needs help text.
