# Nuxt Photo migration record

Historical research archive; not active policy.

Baseline source SHA:
`4b4b94a43d08d8fb0f7eaf74ecd374a4c2348ac0`

Migration date: **2026-07-16**

## Purpose

Nuxt Photo is the first Lupinum migration that combines:

- two coordinated published packages;
- a Vue browser UI library;
- a Nuxt module;
- real playground and Tailwind consumers;
- a Ginko-based documentation application;
- exact package-order and partial-publication risk.

The goal is to prove the maintenance standard on a realistic package set,
publish through the new process, and feed demonstrated lessons back into the
starter template.

## Reading order

1. [Baseline and rationale](./00-baseline-and-rationale.md)
2. [Target maintenance profile](./01-target-profile.md)
3. [Reusable migration playbook](./02-migration-playbook.md)
4. [Decision log](./03-decision-log.md)
5. [First release walkthrough](./04-release-walkthrough.md)
6. [Branch scope handling](./05-branch-scope-handling.md)
7. [Evidence and verification](./06-evidence-and-verification.md)
8. [Retrospective template](./07-retrospective-template.md)
9. [Downstream checklist](./08-downstream-migration-checklist.md)

## Evidence rules

- Historical claims identify the baseline SHA or date.
- Runtime measurements are observations, not permanent budgets.
- A passing workspace check does not prove packed consumer behavior.
- A local candidate is not publication authority.
- A recommendation is retained only when it solves an observed problem.
- If later implementation contradicts this archive, update active policy first.
  Preserve the archive as history or annotate the superseded decision.

## Deletion

This archive is intentionally removable. See `internal/README.md`.
