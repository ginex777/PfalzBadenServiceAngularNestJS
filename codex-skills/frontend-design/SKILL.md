---
name: frontend-design
description: Production-grade UI/UX design and visual polish for PBS Angular frontends. Use whenever a task touches UI in `pbs-webapp/` (Angular) or `pbs-mobile/` (Angular + Ionic/Capacitor)—even small component changes—to ensure the result looks modern, cohesive, and not “default AI UI”. Do not use for backend/API/DB work.
---

# Frontend Design (PBS)

Create distinctive, production-grade interfaces that feel intentionally art-directed (not generic), while staying consistent with the existing PBS styling and architecture.

## Non-negotiables for this repo

- Keep business logic in the backend (frontends are UI + state only).
- Keep TypeScript strict: do not use `any`, `as unknown as`, or unsafe casts to “make it compile”.
- Use English identifiers for code (services, DTOs, variables, etc.).
  - Exception: keep Angular component names (class/selector/files) in German.
  - Component API must be English (`@Input()`/`@Output()` names and template bindings). If you touch German API names, translate them and update all usages in the same change.
- Follow existing patterns; prefer extending existing styles/tokens over inventing a new design system.
- Leave the repo compiling (no TypeScript errors in files you touched).

## Workflow is key (permission + guardrails)

- If the current UI/UX flow is clearly poor (confusing steps, unnecessary clicks, unclear hierarchy, missing states), you may redesign the workflow—not just restyle.
- Keep scope proportional to the problem:
  - Fix small issues inline.
  - For a “complete restructure” (navigation, page composition, component responsibilities), first write a short, concrete change plan in the response (3–6 bullets) and then implement it end-to-end.
- Preserve backend-as-source-of-truth: do not move business rules into the frontend to “simplify the flow”.
- Prefer vertical slices over huge diffs: restructure one flow at a time and keep changes consistent with existing patterns/tokens.

## Workflow

1. Inspect what already exists
   - Scan the relevant app’s global styles and existing components before designing.
   - Reuse existing CSS variables/tokens and spacing patterns.

2. Decide a clear direction (silently)
   - Purpose: what the screen does and what should feel “easy/premium/fast/technical”.
   - Aesthetic direction: commit to one coherent language (e.g. editorial, brutally minimal, industrial, retro-futurist).
   - Differentiator: pick one memorable motif (e.g. dramatic type, asymmetric grid, tactile borders, cinematic hero).

3. Implement with high craft (scope discipline)
   - Always do a quick “design pass” on the touched UI:
     - spacing rhythm, typography hierarchy, alignment, affordances, states (hover/focus/disabled/loading/empty).
     - reduce “AI-looking” patterns: generic cards, random gradients, inconsistent radii/shadows, weak type scale.
   - Keep changes proportional:
     - If the task is small, do micro-polish (tokens, spacing, states) rather than a full redesign.
     - Only do a large restyle if the user explicitly asked for it or if the existing UI is clearly broken/inconsistent.

4. Implement with high craft (craft checklist)
   - Typography: use the existing font setup unless the task explicitly calls for changing it.
   - Color: prefer existing tokens; add new tokens only when needed and name them consistently.
   - Layout: build strong hierarchy at first glance; use spacing intentionally.
   - Motion: include only a few intentional moments (hover/enter/transition), prefer CSS, keep it subtle and performant.
   - Accessibility: preserve semantic HTML, keyboard support, focus states, and adequate contrast.
   - Responsiveness: design for narrow → wide; avoid “desktop-only” layouts.

5. Validate and ship
   - For `pbs-webapp/`: run `npm run build --prefix pbs-webapp` (and relevant tests if changed).
   - For `pbs-mobile/`: run `npm run build --prefix pbs-mobile` (and keep Ionic interactions/touch targets intact).

## App-specific guidance

### `pbs-webapp/` (Angular web)

- Prefer leveraging existing global tokens in `pbs-webapp/src/styles.scss` (CSS variables, shadows, radii, surfaces).
- Keep styling consistent with the app’s current direction; avoid importing new global font stacks unless required by the brief.
- Prefer SCSS + CSS variables; avoid one-off magic numbers when a token/pattern already exists.

### `pbs-mobile/` (Angular + Ionic)

- Prefer Ionic components and theming rather than rebuilding controls from scratch.
- Reuse the existing tokens in `pbs-mobile/src/styles.scss` (`--app-*` and `--ion-*` variables).
- Respect mobile constraints: `min-height` touch targets, safe-area padding when relevant, and readable type at small sizes.

## Output behavior

- State the chosen aesthetic direction in 1–2 sentences (no long theory).
- Deliver the finished implementation.
- Add 2–5 short notes about the most important design decisions or tradeoffs.

## Avoid

- Generic “hero + 3 cards + testimonial + CTA” templates by default.
- Random effects without a concept (unmotivated gradients, shadows, animations).
- Introducing a conflicting design system when the task is not a full redesign.
