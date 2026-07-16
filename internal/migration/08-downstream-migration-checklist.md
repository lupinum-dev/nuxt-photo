# Downstream migration checklist

Use this for the next Lupinum repository. Remove every Nuxt Photo-specific item
that does not represent a real contract.

## Orientation

- [ ] Read agent and maintainer instructions.
- [ ] Record SHA, branches, tags, public versions, releases, CI, and settings.
- [ ] Classify repository profile.
- [ ] Identify published packages and dependency order.
- [ ] Trace command graphs instead of trusting script names.
- [ ] Record package exports, files, peers, engines, and lockfile policy.
- [ ] Identify real consumers and duplicate fixtures.
- [ ] Capture focused baseline output and durations.

## Toolchain

- [ ] Select the exact Vite+ version.
- [ ] Confirm framework support before migration.
- [ ] Use one Vite runtime.
- [ ] Keep TypeScript inside framework peer ranges.
- [ ] Move formatting to Oxfmt.
- [ ] Move general linting to Oxlint.
- [ ] Move Vitest config into Vite+.
- [ ] Retain only demonstrated framework exceptions.
- [ ] Delete the old general tooling path.
- [ ] Add `.node-version`, `.npmrc`, editor config, and bounded engines.
- [ ] Apply pnpm strict peers, release age, and reviewed build-script policy.

## Commands

- [ ] `vp check` is the fast useful loop.
- [ ] `vp test` owns repository behavior.
- [ ] `vp run verify` is the complete handoff gate.
- [ ] `vp run release:pack` creates the candidate.
- [ ] `vp run release:verify` is authoritative on main.
- [ ] `vp run release:notes` gives one next release action.
- [ ] No two commands prove the same expensive contract unnecessarily.

## Package contract

- [ ] Build from clean output.
- [ ] Pack twice and compare bytes.
- [ ] Verify manifest parity.
- [ ] Verify exports, declarations, source maps, and files.
- [ ] Reject local, workspace, Git, and URL dependency sources.
- [ ] Install exact tarballs outside the workspace.
- [ ] Test one representative consumer per distinct contract.
- [ ] Retain one package or package-set artifact.

## CI

- [ ] Stable `PR gate`.
- [ ] Stable `Main healthy`.
- [ ] Every supported Node major has intentional coverage.
- [ ] Full browser behavior runs only once unless another lane proves something
      distinct.
- [ ] Main retains the exact candidate.
- [ ] Pull-request runs cancel when superseded.
- [ ] Main release evidence is not silently canceled.
- [ ] Actions use full commit SHAs.
- [ ] Artifact retention is explicit.

## Versioning and release

- [ ] Source versions were compared with public registry versions.
- [ ] Any already-prepared release has one explicitly documented transition
      strategy; no empty Changeset is manufactured.
- [ ] Changesets is the sole version path.
- [ ] Multi-package groups are explicit.
- [ ] Version workflow opens one reviewable pull request.
- [ ] Package changelogs are canonical; any root changelog is an index only.
- [ ] Local publication is removed.
- [ ] Release consumes the retained exact-SHA artifact.
- [ ] Publication installs and builds nothing.
- [ ] Each candidate uses a unique staging tag derived from immutable release
      identity, not a shared fixed tag.
- [ ] Human approval boundaries are explicit.
- [ ] Provenance is verified.
- [ ] Partial failure reuses existing bytes.
- [ ] Rollback restores dist-tags rather than pretending npm versions can be
      replaced.

## Documentation and agents

- [ ] `AGENTS.md` names sources of truth and authorization boundaries.
- [ ] `CLAUDE.md` points to `AGENTS.md`.
- [ ] `CONTRIBUTING.md` is contributor-focused.
- [ ] `MAINTAINING.md` answers operational questions directly.
- [ ] `SECURITY.md` has a private reporting path and support policy.
- [ ] Branch scope creep has a practical rescue protocol.
- [ ] “Help me release this” starts assessment, not publication.
- [ ] Internal migration research is tracked but clearly removable.

## Repository settings

- [ ] Protect main and require `PR gate`.
- [ ] Configure required deployment reviewers.
- [ ] Configure trusted publishing.
- [ ] Enable Actions-created pull requests for versioning.
- [ ] Enable private vulnerability reporting.
- [ ] Enable secret scanning and push protection.
- [ ] Enable CodeQL where supported.
- [ ] Keep default workflow permissions read-only.

## Handoff

- [ ] Clean install passes.
- [ ] Fast checks pass.
- [ ] Complete local gate passes.
- [ ] Pull-request CI passes.
- [ ] Main candidate passes and is retained.
- [ ] No obsolete tool or release path remains.
- [ ] Migration decision log is current.
- [ ] First release walkthrough is ready.
