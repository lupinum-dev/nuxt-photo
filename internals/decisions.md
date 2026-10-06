# Decisions

- **D1 (2026-09-28): Adopt Lupinum OSS v2 and retain package behavior checks.**
  Three workflows replace classification, certification, reconciliation, custom
  provenance verification and deployment automation. Photo keeps one sequential
  complete CI job, including minimum-Node compatibility checks, because generated
  Nuxt types, packed consumers and browser builds depend on built packages. The
  one required status is `ci`.
- **D2 (2026-09-28): Keep one fixed two-package release.** Packed consumer tests
  cover exact sibling versions, framework peer floors, declarations, exports and
  package contents. Repeated byte-identical builds and release eligibility
  manifests are removed; they are not product behavior." The starter publishes
  Vue before Nuxt (dependency order, D11).
- **D3 (2026-09-28): Keep the existing toolchain and native dependency policy.**
  Vite+, Vue template ESLint, vue-tsc, Nuxt Module Builder and unbuild remain.
  pnpm and Renovate retain the 24-hour quarantine without package exemptions.
- **D5 (2026-09-28): Publish only the current approved main artifact.** Replaced
  by D11. The publish job failed when `main` had moved after approval; that
  cancelled the `1.0.0-beta.7` publish when an unrelated PR merged.
- **D4 (2026-09-28): Complete provider cutover before merging the standard port.**
  The main ruleset must require `ci` from GitHub Actions. Replace the old CodeQL
  workflow with default setup, retain secret scanning and push protection, and
  verify the `npm` environment requires a reviewer, allows only main and denies
  admin bypass. npm trusted publishing remains `release.yml` / `npm` for both
  packages; no workflow-identity migration is needed. Verify these controls in
  the provider before claiming release readiness. No provider setting is changed
  by this code. Vercel uses Git integration with `docs/` as Root Directory and
  source files outside it enabled. Remove unused deployment secrets after the
  provider migration is approved.
- **D6 (2026-10-03): Test the published tarballs and keep recovery safe.**
  Replaced by D11, which says what happened to each release step.
- **D7 (2026-10-06): Adopt Lupinum OSS v3.** Both packages ship the built docs
  pages as `./agent-docs`, and each package README has the Agent setup; the
  separate skill and its reference generator are removed. Checks the handbook
  lists as not worth adding are removed: the action-SHA verifier, the
  dependency-policy checker (pnpm enforces the quarantine itself), and the
  metadata, Vercel and docs-theme shape checks. `pnpm build` also builds the
  docs, because the packed packages contain them; `pnpm build:packages` builds
  only the packages. The 1.0 prereleases keep the name `beta`; prereleases after
  1.0 are named `next`. Both publish under the `next` dist-tag.
- **D8 (2026-10-06): Keep the packed consumer tests, the bundle-size budget and the docs contract checks (FILE-08: lean).**
  They are most of the 2,000 lines in `scripts/`. Packed tests install the real
  tarballs at the framework floors, the size budget guards what users download,
  and the docs checks keep examples and references true to the code.
- **D9 (2026-10-06): One maintainer, with the release summary as the check.**
  Matthias maintains Nuxt Photo alone with agents, with one GitHub account and
  the current app permissions. There is no second reviewer, so the pack job
  lists every change to the release workflows, `scripts/release.mjs` and
  `.changeset/config.json` since the release that npm has now. Read it before
  approving the npm deployment. The handbook's "A second maintainer" section says what to
  add when that changes.
- **D10 (2026-10-06): Shared repository layout.** The root keeps only
  `README.md`, `LICENSE`, `AGENTS.md`, the workspace manifests and configuration
  that tools read from the root. Community files and `renovate.json` live in
  `.github/`, `CLAUDE.md` in `.claude/`, maintainer notes in `internals/`. The
  Playwright config lives with its tests in `playground/`, the shared TypeScript
  base with the packages, and pnpm settings in `pnpm-workspace.yaml`. The
  root changelog index is gone: each package has its own changelog.
- **D11 (2026-10-06): Adopt Lupinum OSS 834961b; the release machinery is the starter's.**
  `release.yml` and `scripts/release.mjs` match the starter apart from action
  pins, because the handbook allows no exception for `release.yml` and nothing
  below needs one for `release.mjs`. The starter's guards replace D5: publish
  needs a green `ci` on the released commit and refuses a version below its
  dist-tag, but a later merge to `main` no longer cancels a release. CI blocks
  only advisories that reach users of the packages (`scripts/audit-deps.mjs` in
  `pnpm verify`), so the ignored dev-tool advisories are gone. Changesets never
  versions or tags private workspace packages. What happened to the old release
  steps:
  - Packed tests on the release tarballs: dropped. `pnpm verify` in `ci` runs
    them on the output of `pnpm build` of the same commit, and publish needs
    that green `ci`.
  - Vue before Nuxt: kept by the starter, which now publishes in dependency
    order. A partial publish is finished with "Re-run failed jobs".
  - Failing on a version on npm without provenance, re-offering a release with
    a missing tag, the partial-publish source check and the stricter own-range
    check of the version patch: dropped here, proposed for the starter.
