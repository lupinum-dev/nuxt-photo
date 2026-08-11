# Decision log

Historical decisions from the Nuxt Photo migration.

## D1: use Nuxt Photo as the first complex pilot

Accepted because it combines the package, framework, browser, docs, and
multi-package contracts the portfolio needs to standardize.

Tradeoff:

- higher migration complexity than a single plain package;
- much higher learning value.

Guardrail:

- preserve product behavior and perform a no-publication rehearsal before the
  first staged release.

## D2: standardize outcomes before implementations

Accepted:

- `vp check`;
- `vp test`;
- `vp run verify`;
- `vp run release:pack`;
- `vp run release:verify`;
- `vp run release:notes`.

Repository-specific implementation remains visible in local scripts and
workflows. No shared maintenance package or CLI was added.

## D3: use Vite+ as the common toolchain

Accepted because it provides one interface for formatting, general linting,
type-aware lint rules, Vitest, tasks, and package management.

Rejected:

- keeping Prettier beside Oxfmt;
- keeping general ESLint beside Oxlint;
- running standalone Vitest as a second supported path.

## D4: retain a narrow Vue-template ESLint exception

Accepted because the selected Oxlint version does not prove the existing Vue
template semantics.

The exception is limited to authored `.vue` files and `eslint-plugin-vue`.

Exit criterion:

- a future Oxlint version must demonstrate equivalent template parsing and
  rules on this repository before the exception is deleted.

## D5: keep framework-aware compiler checks

Accepted:

- type-aware Oxlint rules in the fast gate;
- `vue-tsc` and Nuxt-generated typechecks in the complete gate.

Rejected:

- treating TS-Go compiler diagnostics as authoritative for Vue SFC and Nuxt
  virtual modules;
- adding shims solely to make a generic compiler accept generated aliases.

## D6: use one Vite runtime

Accepted:

- workspace-wide Vite+ core alias;
- matching direct Rolldown peer required by Nuxt Vite Builder.

Rejected:

- root real Vite plus Vite+ internal core;
- root Vite+ alias plus package-local real Vite;
- global split Vite/Vitest resolution.

Evidence is recorded in `06-evidence-and-verification.md`.

## D7: keep TypeScript within framework peer support

The starter's TypeScript version was not copied blindly. Nuxt Photo uses one
exact version accepted by Nuxt Module Builder.

Problem solved:

- strict peer installation would otherwise reject the toolchain.

Review trigger:

- upgrade Nuxt Module Builder and TypeScript as one reviewed tuple when its peer
  range supports the newer compiler.

## D8: preserve `unbuild` and Nuxt Module Builder

Accepted because they own actual output contracts:

- SFC-preserving Vue distribution;
- Nuxt module declarations and runtime layout.

Rejected:

- forcing `vp pack` merely for cosmetic uniformity;
- retaining two package builders for the same package.

## D9: release both packages as one fixed set

Accepted:

- Changesets fixed group;
- identical versions;
- Vue-before-Nuxt public stage approval and final promotion;
- one package-set artifact;
- one Git tag and GitHub Release.

Problem solved:

- partial release and dependency drift.

## D10: certify packed artifacts

Accepted:

- double pack;
- exact manifest and digest checks;
- clean Vue consumer;
- clean Nuxt consumer with both retained tarballs.

Rejected:

- workspace-only package proof;
- rebuilding after CI;
- using a locally created release tarball.

## D11: stage before final promotion

Accepted:

- npm trusted publishing in stage-only mode;
- unique per-candidate `lupinum-stage-<ci-run-id>` tag;
- personal npm 2FA stage approval and promotion;
- final tag promotion only after both packages pass.

Rejected:

- one shared staging tag whose rollback state can be overwritten by another
  release;
- direct `latest` publication;
- promoting one stable package while the other is unverified;
- a local fallback publisher.

## D12: keep docs and deployment separate from npm

The docs build is part of release verification because it is a real consumer.
Deployment is not part of package publication.

Problem solved:

- package release cannot be blocked or partially mutated by an unrelated
  deployment failure;
- docs health remains visible as its own operational contract.

## D13: Renovate is the sole dependency updater

Dependabot and Renovate must not compete. Routine updates, grouped toolchain
changes, lockfile maintenance, and release-age policy belong to Renovate.

No blanket automerge is permitted.

## D14: no shared maintenance CLI yet

Accepted architecture:

- repository-owned scripts;
- repository-owned workflows;
- active runbooks;
- agent concierge using those sources.

Reconsider only after at least three production repositories converge through
multiple real releases.

## D15: preserve research but make it removable

`internal/migration/` captures the pilot without becoming active policy.

Downstream starter-derived repositories delete `internal/` unless they are
recording their own migration.

## D16: preserve the prepared `0.2.0` transition

Accepted:

- source and package changelogs already describe `0.2.0`;
- npm currently serves `0.1.2`;
- the first migrated release certifies and publishes the reviewed `0.2.0`
  candidate without inventing an empty Changeset or bumping it again;
- normal Changesets enforcement begins after `0.2.0` is published.

Alternative:

- resetting both packages to `0.1.2` for a prerelease rehearsal is allowed only
  after an explicit maintainer decision.

Problem solved:

- preserves reviewed release intent without teaching a second permanent
  versioning path.
