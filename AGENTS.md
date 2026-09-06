# Working on Nuxt Photo

Nuxt Photo provides Vue photo components and their Nuxt integration. Keep the
public gallery, image, lightbox, accessibility, and packed-package contracts
intact. A release service, another command runner, and unrelated framework
migrations are outside this repository's scope.

Read [MAINTAINING.md](MAINTAINING.md) for setup, commands, delegated work,
verification, and recovery. Read [docs/WRITING.md](docs/WRITING.md) before changing
public prose. Preserve existing work and define observable acceptance criteria
before editing. Prefer `delete > simplify > replace > add`.

## Ownership

- Root `package.json` owns commands, Node support, and pnpm. The workspace YAML
  owns shared dependency versions, quarantine, and reviewed install scripts.
- Public package manifests own versions, dependencies, exports, and peer ranges.
  `packages/*/src` owns behavior; package tests, packed consumers, and the
  playgrounds prove it. Do not copy versions or export lists into instructions.
- `vite.config.ts` owns Vite+ formatting, general linting, and test selection.
- `docs/` is consumer documentation and a real workspace consumer.
- Changesets own release intent and the two package changelogs. Root
  `CHANGELOG.md` is an index. Workflows own CI and publication gates.

## Invariants

Keep Vite+ as the common interface and one Vite runtime. Retain Vue template
ESLint, `vue-tsc`, Nuxt preparation, Nuxt Module Builder, and `unbuild`: they
cover framework contracts that the general checker does not. Read installed
`node_modules/vite-plus/docs` before guessing commands. Do not replace compiler
or framework checks with `vp check` alone.

Both public packages use one Changesets fixed group. Nuxt's packed dependency
must equal the Vue candidate version; publication runs Vue first. Add a
Changeset for public package changes, not maintenance-only changes. Do not edit
versions by hand or create another release-note authority.

Keep fixture setup, missing build output, unsupported compatibility checks,
and expired quarantine exceptions as failures. Packed consumer proof must use
retained tarballs outside the source workspace. Preserve two clean build-and-pack
passes for byte reproducibility and the incompatible sibling dependency test.

Do not edit generated `dist`, `.release`, `.nuxt`, or `.output` by hand. Do not
add non-registry dependencies to package contracts or consumer lifecycle hooks
without a reviewed requirement. Temporary tarball installs belong only in
isolated certification fixtures.

Publication consumes retained artifacts through `release.yml` and the human
`npm` approval. Do not publish locally, add npm tokens, rebuild during
publication, or weaken provenance and recovery checks. Pin Actions to full
commit SHAs. Follow the authority and partial-failure rules in MAINTAINING.
