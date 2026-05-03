---
name: pbs-docs-workflow
description: PBS documentation workflow for roadmap specs, master plan index, decisions log, audits, and implementation notes. Use when creating or updating docs under `docs/`, specs, task plans, review summaries, TODO lists, or architecture decisions.
---

# PBS Docs Workflow

Keep docs useful, small, and discoverable.

## Rules

- `docs/master-plan.md` is a roadmap index only.
- Specs live in `docs/specs/{backlog,active,done}/`.
- One spec file per task.
- `docs/decisions.md` is append-only.
- Do not edit `docs/project-audit.md` unless explicitly asked.
- UI audits go in `docs/ui-audits/`.
- AI/Codex setup notes go in `docs/ai/`.

## Spec Updates

- Read only the relevant spec before work.
- When status changes, move the spec file, update frontmatter, update master-plan index, and append decisions only if meaningful.
- Do not mix unrelated docs cleanup into implementation tasks.

## Review/TODO Docs

- Date the file in `YYYY-MM-DD`.
- Lead with highest-risk findings.
- Include concrete action items with checkboxes.
- Keep evidence tied to file paths.
