# Reusable migration playbook

This playbook records the sequence used for Nuxt Photo. Adapt it by repository
profile; do not copy browser, Nuxt, docs, or multi-package infrastructure into
a plain library without a demonstrated contract.

## Phase 0: freeze and record

Before changing tooling:

1. Freeze unrelated feature work.
2. Record the source SHA, branch, dirty state, public versions, dist-tags, tags,
   releases, open pull requests, and recent CI.
3. Record all published packages and their dependency order.
4. Run only the focused baseline commands needed to capture package files,
   exports, declarations, sizes, tests, and consumer behavior.
5. Record command durations and generated output.
6. Preserve the baseline findings in a dated internal document.

Acceptance:

- the migration can distinguish product regressions from intentional tooling
  changes;
- release state is known before any publication path changes.

## Phase 1: identify contracts, not scripts

Trace what every important command actually executes:

- build;
- check/lint/format;
- typecheck;
- unit/integration/browser tests;
- docs build;
- size;
- package pack;
- release verification;
- publication.

Mark:

- repeated builds;
- checks that depend on existing `dist` or `.nuxt`;
- workspace-only consumer tests;
- release-time rebuilds;
- local publication authority;
- hidden hoisting;
- framework-specific proof that a generic tool cannot replace.

Acceptance:

- every retained command has a named contract;
- duplicate work is visible before command names are standardized.

## Phase 2: select the repository profile

For Nuxt Photo the selected profile was:

- coordinated multi-package library;
- Nuxt module;
- browser-heavy Vue UI;
- docs/application consumer.

Choose standard outcomes:

- fast local check;
- repository tests;
- complete handoff gate;
- exact package candidate;
- main release gate;
- staged publication;
- rollback.

Do not begin with a universal workflow. Start from the contracts this repository
must prove.

## Phase 3: hard-cut the developer toolchain

1. Add the exact Vite+ toolchain.
2. Move formatting into `vite.config.ts`.
3. Move general lint rules into `vite.config.ts`.
4. Move Vitest configuration into `vite.config.ts`.
5. Replace pnpm workspace task syntax with visible `vp run`/`vp exec` commands.
6. Delete Prettier.
7. Delete general ESLint rules.
8. Retain only the smallest framework-specific exceptions.
9. Add editor configuration that points at the same Vite+ config.
10. Regenerate the lockfile once with the declared pnpm release.

Acceptance:

- one common tool path remains;
- `vp check` and `vp test` are useful;
- no package output or public behavior changes unintentionally.

## Phase 4: prove framework compatibility

For a Nuxt/Vue profile:

1. Verify the exact Vite/Vitest/TypeScript resolution in every workspace.
2. Run package builds from a clean state.
3. Run Vue SFC typechecks.
4. Run Nuxt preparation and application typechecks.
5. Run the real Nuxt integration fixture.
6. Build the main playground.
7. Build any materially distinct integration playground.
8. Build the docs application.

Do not restore hoisting or add compatibility shims when a missing direct
dependency is exposed.

Acceptance:

- the clean workspace uses one intended runtime for each tool;
- every retained framework exception solves a reproduced incompatibility.

## Phase 5: make package bytes authoritative

1. Discover public packages from manifests.
2. Topologically sort them from real workspace dependencies.
3. Build and pack each package twice from clean output.
4. Require byte-identical tarballs.
5. Compare security-sensitive packed metadata to reviewed source.
6. Reject workspace, local-path, Git, and URL dependencies.
7. Verify exports, declarations, file allowlists, source maps, and lifecycle
   scripts.
8. Install the exact Vue tarball in a clean Vue consumer.
9. Install both exact tarballs in a clean Nuxt consumer.
10. Build the clean Nuxt consumer.
11. Retain both tarballs and one package-set manifest.

Acceptance:

- the candidate is reproducible;
- consumers exercise packed bytes, not workspace aliases;
- release order and exact internal dependency rewriting are explicit.

## Phase 6: establish CI authority

Create stable outcomes rather than exposing every implementation job:

- `PR gate`: compatibility plus complete verification;
- `Main healthy`: compatibility plus exact release candidate.

Rules:

- test every declared Node major intentionally;
- keep the complete browser suite in one lane;
- do not rerun the same full suite in each Node lane;
- upload release candidates only from main;
- upload browser traces only when useful;
- cancel superseded pull-request runs;
- do not cancel an active main candidate after publication planning begins.

Acceptance:

- branch protection names one stable merge check;
- a maintainer can identify the exact main artifact eligible for release.

## Phase 7: cut over versioning

1. Add Changesets.
2. Define the coordinated package group.
3. Compare source versions with the public registry before generating a
   version.
4. Convert pending unreleased intent into Changesets unless the repository
   already contains a fully reviewed prepared release.
5. For a prepared release, document exactly one transition strategy: preserve
   and certify it, or explicitly reset to the public version for a rehearsal.
6. Let the version workflow own package versions and package changelog
   generation after that transition.
7. Keep the root changelog as an index when multiple package changelogs are
   canonical.
8. Remove manual version editing guidance.

Nuxt Photo chose to preserve the already-prepared `0.2.0` candidate while npm
was on `0.1.2`. It must not receive an empty Changeset or another version bump.
Normal Changesets enforcement begins after `0.2.0` is published.

Acceptance:

- one reviewed version pull request owns each package set;
- no competing version path remains.

## Phase 8: cut over publication

1. Create the CI-only release workflow.
2. Consume the retained main artifact by numeric CI run ID.
3. Prepare a read-only release plan.
4. Stage exact bytes through npm trusted publishing.
5. Require maintainer npm 2FA approval for Vue, then Nuxt.
6. Verify both under a unique candidate tag such as
   `lupinum-stage-<ci-run-id>`.
7. Promote the final channel in dependency order with maintainer 2FA.
8. Restore or remove the candidate-specific temporary tags using the exact
   release record after both final tags agree.
9. Finalize one Git tag and GitHub Release separately.
10. Delete the local publication script and all local publish instructions.

Acceptance:

- publication builds nothing;
- partial failure can continue from the same exact artifacts;
- the maintainer cannot accidentally publish by running a local package command.

## Phase 9: configure repository settings

Manually verify:

- `PR gate` branch protection;
- one protected `npm` environment applied to both stage-submission and final
  registry-verification deployments;
- required human reviewers;
- npm trusted publisher stage-only restriction;
- GitHub Actions pull-request permission for the version workflow;
- secret scanning and push protection;
- private vulnerability reporting;
- CodeQL;
- default read-only workflow permissions.

Workflow files cannot create or prove all repository settings by themselves.

## Phase 10: first release and retrospective

For the pilot release:

1. use the release concierge;
2. record every human and automated step;
3. record waiting time separately from runner time;
4. capture every confusing instruction or recovery decision;
5. test the released set in a fresh external consumer;
6. complete `07-retrospective-template.md`;
7. feed back only repeated, stable improvements.

Do not create a shared CLI or reusable universal workflow based on one release.
