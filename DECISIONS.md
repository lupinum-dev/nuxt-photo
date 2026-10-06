# Decisions

- **D1 (2026-09-28): Adopt Lupinum OSS v2 and retain package behavior checks.**
  Three workflows replace classification, certification, reconciliation, custom
  provenance verification and deployment automation. The current OSS starter
  supplies `release.yml`, `preview.yml`, `release.mjs` and Changeset lint.
  Photo keeps one sequential complete CI job, including minimum-Node compatibility
  checks, because generated Nuxt types, packed consumers and browser builds depend
  on built packages. The one required status is `ci`.
- **D2 (2026-09-28): Keep one fixed two-package release.** The publish and dry-run
  loops explicitly handle Vue before Nuxt. Packed consumer tests still cover
  exact sibling versions, framework peer floors, declarations, exports and
  package contents. Repeated byte-identical builds and release eligibility
  manifests are removed; they are not product behavior.
- **D3 (2026-09-28): Keep the existing toolchain and native dependency policy.**
  Vite+, Vue template ESLint, vue-tsc, Nuxt Module Builder and unbuild remain.
  pnpm and Renovate retain the 24-hour quarantine without package exemptions.
- **D5 (2026-09-28): Publish only the current approved main artifact.** The
  canonical publish job serializes publication and checks current main after
  approval, immediately before npm. A stale approved run fails and must be
  restarted from current main. Registry read errors fail closed; only a
  confirmed npm JSON `E404` permits publication of a missing version.
  The check/pack helper applies the same rule. At provider cutover, cancel old
  pending release runs and start a new run from current main: rerunning an old
  workflow does not add the new guards.
  The version-patch guard accepts only numeric own-package version changes,
  retaining the existing workspace protocol and range operator. It cannot
  redirect an own-package dependency to an alias, URL or object value.
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
- **D6 (2026-10-03): Test the published tarballs and keep recovery safe.** The
  pack job runs the packed consumer tests on the exact tarballs that publish
  uploads. `release.mjs` packs every public package; publish skips versions
  already on npm and accepts one only with provenance. A missing release tag
  re-offers the release, so a fresh run repairs a failed GitHub release. When
  part of a version is already on npm, a fresh run continues only if the package
  source is unchanged since the version commit; otherwise re-run all jobs of the
  original run.
- **D7 (2026-10-06): Adopt Lupinum OSS v3.** Both packages ship the built docs
  pages as `./agent-docs`, and each package README has the Agent setup; the
  separate skill and its reference generator are removed. Checks the handbook
  lists as not worth adding are removed: the action-SHA verifier, the
  dependency-policy checker (pnpm enforces the quarantine itself), and the
  metadata, Vercel and docs-theme shape checks. `pnpm build` also builds the
  docs, because the packed packages contain them; `pnpm build:packages` builds
  only the packages. The 1.0 prereleases keep the name `beta`; prereleases after
  1.0 are named `next`. Both publish under the `next` dist-tag.
- **D8 (2026-10-06): Keep the packed consumer tests, the bundle-size budget and the docs contract checks (FILE-08).**
  They are most of the 2,000 lines in `scripts/`. Packed tests install the real
  tarballs at the framework floors, the size budget guards what users download,
  and the docs checks keep examples and references true to the code.
