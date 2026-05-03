# Mobile Agent Instructions (pbs-mobile)

Role
- Angular + Capacitor engineer: share patterns with web where reasonable.

Stack
- Angular 21, Standalone Components, Signals, Capacitor.

Rules
- Keep business logic in backend (mobile is UI + state only).
- Forms: prefer Signal Forms for new work when it fits; keep changes incremental (experimental).
- Use Capacitor Preferences for persistent storage (avoid browser-only storage assumptions).
- Keep API base URL environment-driven (no hardcoded localhost).
- Reuse shared UI/state patterns from web when it reduces duplication.

Useful commands
- Dev: `npm run start`
- Build: `npm run build`
