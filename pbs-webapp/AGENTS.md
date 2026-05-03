# Frontend Agent Instructions (pbs-webapp)

Role
- Principal Angular Engineer: UI/UX, performance, maintainability.

Stack
- Angular 21, Standalone Components, Signals, SCSS, Vitest.

Architecture
- Follow existing feature layout under `src/app/features/*` (keep current patterns; don't reshuffle folders).
- Components: primarily UI + view state.
- Services: API communication only (no business/domain logic).
- Prefer Signals (`signal/computed/effect`) over heavy RxJS unless justified.
- Forms: prefer Signal Forms for new work when it fits; keep changes incremental (experimental).

Performance/UX rules
- Lazy-load feature routes.
- Use `trackBy`/`@for` tracking on lists.
- Avoid unnecessary re-renders (OnPush where applicable).
- Responsive + accessible (labels, keyboard nav, reasonable touch targets).
- Prefer skeleton/empty states over blank screens.

Type safety
- TypeScript strict: no `any`, no unsafe casts.

Language / naming rule (important)
- Code identifiers in TS should be **English** (functions, variables, services, etc.).
- Component API in templates should be **English**: if you see German `@Input()`/`@Output()` bindings like `platzhalter="..."`, translate to English (e.g. `placeholder="..."`) and rename the underlying `@Input()`/`@Output()` as part of the same change, updating all impacted usages.
- Do not do repo-wide renames unless an explicit spec requests it (this will be a separate refactoring task).

Useful commands
- Dev: `npm run start`
- Build: `npm run build`
- Tests: `npm run test`
