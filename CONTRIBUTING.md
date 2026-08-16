# Contributing

Thanks for contributing to Nuxt Photo.

The repository publishes a coordinated Vue package and Nuxt module, and keeps
two playgrounds plus the docs application as real consumers. Work against the
smallest surface that proves your change, then run the complete gate once before
handoff.

## Setup

Use:

- the maintainer Node release in `.node-version`;
- Vite+ (`vp`);
- the exact pnpm release declared by `packageManager`.

Install the complete workspace:

```sh
vp install
vp run build
```

The committed lockfile is authoritative. Do not regenerate it with npm, Yarn,
Bun, or another pnpm release.

All workspaces must install without the deleted docs-only hoisting workaround.
If a clean install exposes a missing dependency, declare it in the package that
imports it instead of restoring hoisting.

## Repository layout

- `packages/vue` — Vue components, composables, primitives, styles, layout
  logic, and shared photo types.
- `packages/nuxt` — Nuxt module, runtime plugins, app exports, and generated
  Nuxt integration.
- `playground` — main development and browser-test application.
- `playground-tailwind` — distinct Tailwind integration consumer.
- `docs` — public Ginko-based documentation application and real consumer.
- `test/fixtures` — shared test data and size fixtures.

## Daily commands

```sh
vp check
vp test
```

- `vp check` is the fastest formatting and Oxlint loop.
- `vp test` runs repository behavior without the complete Playwright matrix.

Apply formatting and safe lint fixes explicitly:

```sh
vp check --fix
```

Before requesting review:

```sh
pnpm verify
git status --short
```

`pnpm verify` is the complete local pull-request gate. It includes framework
typechecks, Vue-template lint, packed-package certification, real application
builds, size budgets, and browser tests. It is intentionally heavier than the
daily loop.

Useful focused commands:

```sh
vp test packages/vue/test/core/layout.test.ts
vp test packages/nuxt/test/module.test.ts
vp run typecheck
vp run lint:vue-template
vp run test:browser
vp run build:playground-tailwind
vp run build:docs
vp run release:pack
```

## Why typechecking is separate from `vp check`

Oxlint provides the fast general and type-aware lint path. Vue and Nuxt still
require framework-aware compiler verification:

- `vue-tsc` understands Vue SFCs;
- Nuxt preparation creates `#app`, `#imports`, and application tsconfigs;
- Nuxt Module Builder validates the published module output.

Generic TS-Go compiler diagnostics cannot currently model all of those
contracts without false missing-module errors. Do not treat `vp check` as a
replacement for `vp run typecheck` or the complete `verify` gate.

`eslint-plugin-vue` remains only for Vue template semantics. Do not add general
JavaScript or TypeScript ESLint rules beside Oxlint.

## Development

Choose the consumer that owns the behavior:

```sh
vp run dev
vp run dev:playground
vp run dev:playground-tw
vp run dev:docs
```

- Use the main playground for ordinary package and browser behavior.
- Use the Tailwind playground only for the distinct Tailwind/CSS contract.
- Use the docs app for documentation components, examples, navigation, and
  Ginko integration.

Avoid adding another fixture when an existing consumer can prove the contract.

## Tests

Add tests for the contract being changed:

- unit tests for framework-free helpers and layout algorithms;
- Vue component or composable tests for UI state and SSR behavior;
- Nuxt tests for module setup, generated aliases, CSS registration, and app
  exports;
- packed consumers for installation, dependencies, declarations, exports, and
  registry-like behavior;
- browser tests only for behavior that requires an actual browser;
- docs or Tailwind builds only for their distinct contracts.

Fixture setup failure must fail the suite. Do not turn a required test into a
silent skip.

Keep browser coverage asymmetric. Full cross-engine duplication is not useful
unless an engine-specific defect demonstrates the need.

## Public API and package changes

Public API is owned by declared package exports:

- `@lupinum/vue-photo`;
- its documented subpath exports;
- `@lupinum/nuxt-photo`;
- `@lupinum/nuxt-photo/app`.

Do not encourage deep imports into source or generated internals.

When exports, files, dependencies, peer ranges, declarations, or package
behavior change, run:

```sh
vp run release:pack
```

The packed consumer, not workspace source resolution, is the proof that a
consumer can install the release.

## Changesets

Add a Changeset for every user-visible package change:

```sh
vp run changeset
```

The two packages are a coordinated release set. Describe:

- the affected user contract;
- why the version change is appropriate;
- required migration steps for breaking changes.

Internal refactors, tests, or documentation with no published effect may omit a
Changeset when the pull request explains why.

Do not edit package versions or changelog release headings by hand. The version
pull request owns them.

## Documentation

Update documentation in the same change when modifying:

- public imports or package boundaries;
- components, composables, module options, or public types;
- defaults, support promises, or sharp edges;
- examples used by the README or docs;
- documented bundle-size numbers.

Active documentation lives in:

- `README.md`;
- `packages/*/README.md`;
- `docs/content/docs/**`;
- `packages/vue/CHANGELOG.md` and `packages/nuxt/CHANGELOG.md`, generated by
  Changesets;
- root `CHANGELOG.md`, which is an index only;
- `CONTRIBUTING.md`;
- `MAINTAINING.md`.

Do not treat generated `.nuxt`, `.output`, or raw build output as editable
documentation.

## Pull-request scope

A pull request should represent one review and rollback decision. Required
tests, documentation, and cleanup stay with the outcome.

When another idea appears:

1. Ask whether the original change is incomplete or incorrect without it.
2. Keep it only when it is required.
3. Defer it when it can ship independently or changes another public contract.
4. Record the follow-up instead of silently expanding scope.

If the summary needs “and,” identify whether it contains two independent
outcomes. Do not use arbitrary line or commit limits, and do not rewrite
reviewed history merely for cosmetic tidiness.

## Dependencies

- Declare dependencies in the workspace that imports them.
- Do not rely on hoisting.
- Do not add Git, URL-tarball, `file:`, `link:`, `portal:`, local tarball, or
  absolute-path dependencies.
- Keep runtime imports external so packed consumers expose missing
  dependencies.
- Keep peer ranges no broader than verified compatibility.
- Update `allowBuilds` only after reviewing the dependency's install script.
- Let Renovate own routine dependency-update pull requests.

## Security reports

Do not include undisclosed exploit details in a public issue. Follow
`SECURITY.md`.

## Publication

Contributors and agents do not publish from local machines.

Never run:

```sh
npm publish
pnpm publish
```

After Changesets prepares a reviewed version, main CI creates the exact
two-package candidate. One protected GitHub workflow publishes those retained
bytes with npm trusted publishing and creates the GitHub release. See
`MAINTAINING.md`.
