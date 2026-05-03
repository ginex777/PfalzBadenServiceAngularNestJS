---
name: pbs-review-audit
description: Structured PBS audit and review workflow for code, usability, bugs, frontend UX, mobile UX, backend correctness, architecture boundaries, and action-list generation. Use when the user asks for a comprehensive review, audit, bug hunt, usability review, or TODO list from findings.
---

# PBS Review Audit

Use a review stance. Findings first.

## Workflow

1. Identify scope and enumerate relevant files/components/routes.
2. Run safe verification commands when useful.
3. Inspect implementation against PBS rules.
4. Separate confirmed bugs from risks and design debt.
5. Write a dated Markdown report when requested.
6. End large reports with an action list.

## Severity

- P0: build/test broken, data loss, auth/security break, business-critical wrong behavior.
- P1: likely user-facing bug, accessibility blocker, workflow confusion, duplicated backend business logic.
- P2: maintainability, polish, performance budget, consistency.

## Review Checks

- Backend owns business logic.
- Frontend does not derive critical payroll/accounting/operational rules.
- Tests/builds reflect actual health.
- Accessibility and keyboard paths exist.
- Mobile logout/session/object state cannot bleed across users.
- Errors, empty states, loading, and disabled states are understandable.

## Output

- Findings with evidence and impact.
- Open questions.
- Action list with checkboxes.
- Verification results and commands run.
