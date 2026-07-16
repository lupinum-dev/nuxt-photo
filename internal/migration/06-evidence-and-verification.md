# Evidence and verification

This file records focused migration evidence. Measurements are local
observations from 2026-07-16, not permanent budgets or CI authority.

## Baseline identity

```text
Repository: lupinum-dev/nuxt-photo
Baseline SHA: 4b4b94a43d08d8fb0f7eaf74ecd374a4c2348ac0
Published packages:
- @nuxt-photo/vue
- @nuxt-photo/nuxt
Dependency order:
- Vue before Nuxt
```

At the baseline, source and both package changelogs were prepared as `0.2.0`
while npm still served `0.1.2`. The approved default is to preserve and certify
that candidate without adding an empty Changeset or bumping it again. Normal
Changesets enforcement begins after `0.2.0` is published. Resetting source to
`0.1.2` for a prerelease rehearsal remains an explicit maintainer decision, not
an inferred migration step.

## Vite runtime experiment

Question:

> Must Nuxt workspaces retain a separate real Vite 7 beside Vite+?

Tested layout:

```yaml
catalog:
  vite: npm:@voidzero-dev/vite-plus-core@0.2.4
  vite-plus: 0.2.4
  vitest: 4.1.10
  rolldown: 1.1.4
  typescript: 5.9.3

overrides:
  vite: 'catalog:'
  vitest: 'catalog:'
```

All six workspaces resolved `vite/package.json` to
`@voidzero-dev/vite-plus-core@0.2.4`. Vite+ reported the underlying Vite runtime
as `8.1.3`.

### Failure without direct Rolldown

The main playground build failed:

```text
Cannot find package 'rolldown' imported from @nuxt/vite-builder
```

Reason:

- Nuxt Vite Builder declares an optional Rolldown peer and imports it under the
  Vite 8 path;
- Vite+ core contains its engine but does not expose a package that satisfies
  Nuxt's bare `rolldown` import.

### Result with matching direct Rolldown

After declaring the Vite+-matched Rolldown version:

- both published package builds passed;
- all six workspaces still resolved one Vite core;
- 228 Vitest/Nuxt tests passed;
- main playground production build passed;
- Tailwind playground production build passed;
- docs production build passed;
- Nuxt size scenarios passed.

Decision:

- keep one Vite runtime;
- declare the real Rolldown peer;
- reject a split real-Vite/Vite+ layout.

## TypeScript compatibility evidence

Nuxt Module Builder's installed peer range accepted TypeScript 5 but not the
starter's newer compiler major.

Decision:

- retain one exact TypeScript version inside the framework peer range;
- do not force the plain-library template number;
- review TypeScript and Nuxt Module Builder together in a future update.

## Oxlint compiler evidence

With generic compiler diagnostics enabled across the workspace, the fast check
reported false or non-authoritative errors for:

- `.vue` module imports;
- `#app` and `#imports`;
- generated Nuxt configuration;
- workspace package exports before build;
- test-only aliases.

With compiler diagnostics disabled but type-aware rules retained, the generic
missing-module failures disappeared. Real lint findings remained visible.

Decision:

- keep type-aware Oxlint rules;
- keep compiler authority in `vue-tsc`, Nuxt preparation, and package builds.

## Focused local observations

The isolated migration experiment reused the local pnpm store.

| Command or operation        | Observation                                    |
| --------------------------- | ---------------------------------------------- |
| Complete workspace install  | about 15 seconds after supply-chain validation |
| Public package build        | about 7 seconds                                |
| Vitest and Nuxt integration | about 11 seconds, 228 tests                    |
| Main playground build       | about 8 seconds                                |
| Tailwind playground build   | about 5 seconds                                |
| Nuxt size scenarios         | about 18 seconds                               |
| Docs production build       | about 1 minute, dominated by prerender/OG work |

The docs build attempted font-provider network access and continued with
warnings when those providers were unavailable. This should be reviewed during
the first CI migration:

- either make the build intentionally offline and deterministic;
- or document network access and fail only when the actual supported font
  contract is broken.

## Release-age policy observation

The new 48-hour dependency release-age policy rejected an existing lockfile
entry that was roughly two hours short of the cutoff.

Learning:

- the policy is working;
- migration lockfile changes can reveal recently published transitive packages;
- exceptions must be exact, dated, and removed promptly;
- do not weaken the global policy merely to make a migration pass.

## Production audit observation

The migrated production audit reports no moderate, high, or critical
vulnerabilities. It reports one low-severity advisory,
`GHSA-g7r4-m6w7-qqqr`, through the docs-only
`@lupinum/ginko-docs → fontless → esbuild@0.27.4` path.

The advisory concerns arbitrary file reads from an esbuild development server
on Windows. `fontless@0.2.1` declares `esbuild: ^0.27.0`, while the patched
release starts at `0.28.1`; forcing the incompatible `0.28` line would be an
unproven transitive override.

Decision:

- keep the release gate at high severity;
- keep the advisory visible in Renovate and audit output;
- update through a compatible Ginko/fontless release;
- do not hide it with an audit exclusion or force an incompatible override.

## Final migrated local gate

The complete `vp run verify` gate passed on 2026-07-16 after the Oxfmt hard
cutover.

Observed evidence:

| Contract                  | Result                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Vite+ static gate         | 313 files formatted; 200 files linted; zero warnings                                              |
| Vue-template lint         | Passed                                                                                            |
| Documentation validation  | 37 pages, 3 public READMEs, and 37 routes                                                         |
| Unit and contract tests   | 27 files; 226 tests; 11.74 seconds                                                                |
| Reproducible package set  | Passed in 45.38 seconds including both clean consumers                                            |
| Vue and Nuxt size budgets | All scenarios passed                                                                              |
| Tailwind playground       | Production build passed                                                                           |
| Docs application          | Production build and 157-route prerender passed                                                   |
| Main playground           | Production build passed                                                                           |
| Browser contract          | 16 tests passed in 12.6 seconds across Chromium, mobile Chromium, Firefox smoke, and WebKit smoke |
| Production audit gate     | No moderate, high, or critical advisory                                                           |

The final local dirty-worktree artifact was intentionally not release-eligible.
It proved byte reproducibility with these local SHA-256 values:

```text
@nuxt-photo/vue:
69170ee79339431ac8ecbe2df9bd4c6b7d0a285dcf930450ddbe09883edacffe

@nuxt-photo/nuxt:
ff03ec6631d55cd7cdc2c5c13abd7fd18bde596e0dd0f18bab9b8c1534eba7f1
```

Main CI must generate new clean-tree digests for publication; these local
values are migration evidence only. The artifact also recorded and validated
the declared Node 24.18.0, pnpm 11.13.1, and Vite+ 0.2.4 toolchain. A clean
artifact built with another supported development runtime remains useful
verification evidence but is intentionally not publication-eligible.

## Remote readiness observation

A read-only GitHub API check on 2026-07-16 found:

- the repository is public and `main` is the default branch;
- default workflow permissions are read-only;
- dependency vulnerability alerts are enabled;
- no branch protection or repository ruleset protects `main`;
- Actions-created pull requests are disabled;
- the protected `npm` environment does not exist;
- private vulnerability reporting, secret scanning, and push protection are
  disabled.

No remote setting was changed during the migration. The missing controls are
publication prerequisites documented in `MAINTAINING.md`, not reasons to add
another local verification path.

## Evidence still required for the first release pilot

Before calling the publication mechanism battle-tested:

- [ ] clean install on every supported CI Node lane;
- [ ] `PR gate` on a real pull request;
- [ ] `Main healthy` on the merged exact SHA;
- [ ] retained two-package candidate downloaded and revalidated;
- [ ] prepared `0.2.0` transition published and recorded;
- [ ] a later Changesets version pull request exercised;
- [ ] npm stage-only trusted publishing exercised;
- [ ] personal 2FA approval for both packages exercised;
- [ ] temporary registry tags, tarball SHA-1 values, and provenance verified;
- [ ] partial-promotion rollback rehearsed or simulated safely;
- [ ] Git tag and GitHub Release finalization exercised;
- [ ] first-release retrospective completed.

Local experiments are useful evidence, but they do not replace these remote and
registry-owned facts.
