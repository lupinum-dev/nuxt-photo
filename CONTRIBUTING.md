# Contributing

Thanks for contributing to Nuxt Photo.

This repo has two library packages, two playground apps, and a docs app. The most reliable way to make a good change is to work against the smallest surface that proves the behavior, then run the same checks the repo uses in CI.

## What kinds of contributions help

- Bug fixes in the Nuxt module, Vue components, primitives, or photo helpers
- Documentation improvements for the README, docs site, package READMEs, changelog entries, or contributor workflow
- Tests that lock down a bug, regression, or edge case
- Focused performance or bundle-size improvements with a measurable payoff

## Prerequisites

- Node.js `^22.12.0 || ^24.11.0 || >=26.0.0`
- `pnpm` `11.x`

The repo declares both in the root [`package.json`](./package.json).

## Repo layout

The main workspaces are:

- `packages/vue` — Vue components, composables, primitives, styles, and shared photo helpers
- `packages/nuxt` — Nuxt module integration
- `playground` — main demo app used for development and e2e coverage
- `playground-tailwind` — Tailwind-focused demo app
- `docs` — the public docs app
- `docs/content/docs` — the active docs site content
- `test/fixtures` — shared test helpers

## Setup

Clone the repo, install the portable workspaces, and build the packages once:

```bash
git clone https://github.com/lupinum-dev/nuxt-photo.git
cd nuxt-photo
corepack pnpm install --filter '!nuxt-photo-docs'
pnpm build
```

`pnpm build` compiles the workspace packages in dependency order: `vue` → `nuxt`.

The docs app intentionally consumes a local Ginko Docs tarball. Maintainers who
have that tarball at the path declared in `docs/package.json` can run an
unfiltered `corepack pnpm install` and the docs-specific commands below. The
library packages and playgrounds do not require it.

## Local development

Choose the smallest dev loop that matches your change:

```bash
pnpm dev
pnpm dev:playground
pnpm dev:playground-tw
pnpm dev:docs
```

- `pnpm dev` watches the workspace packages.
- `pnpm dev:playground` builds packages and starts the main Nuxt playground.
- `pnpm dev:playground-tw` does the same for the Tailwind playground.
- `pnpm dev:docs` builds packages and starts the docs site.

## Where docs live

Use the active docs tree, not stale copies or generated output:

- Root `README.md` for the front door
- `packages/*/README.md` for package-specific orientation
- `docs/content/docs/**` for the public docs site
- `CHANGELOG.md` for user-visible release notes
- `CONTRIBUTING.md` for contributor workflow

If you change public API, behavior, defaults, examples, or stability guarantees, update the relevant docs in the same change.

## Documentation standards

Docs in this repo should follow these rules:

- Each page should have one primary job: quickstart, guide, reference, explanation, changelog, or contributing.
- Start with the useful thing. Do not open with generic background paragraphs.
- Keep examples runnable and explicit about setup.
- Prefer task-first guides and neutral reference pages.
- Do not invent defaults, limits, version behavior, or CLI steps. Verify them in code, tests, or config first.

If you touch docs, check for hidden setup, stale facts, and pages that try to do multiple jobs at once.

## Tests and checks

Run the narrowest checks that prove your change while iterating. Before opening a PR, run the full relevant gate.

Run the normal broad gate before review:

```bash
pnpm verify
```

Use these when needed:

```bash
pnpm test:e2e
pnpm build:docs
pnpm build:playground
```

Notes:

- `pnpm test:e2e` builds the main playground first and then runs Playwright across Chromium plus Firefox/WebKit smoke projects.
- `pnpm audit --audit-level moderate` is a release gate.
- `pnpm size` is the source of truth for documented size numbers.
- `pnpm release:pack` packs every public workspace package with pnpm and verifies rewritten workspace dependencies and tarball metadata.
- `pnpm test` includes e2e, so it is heavier than the normal pre-PR loop.

## Release verification

Use pnpm for packaging. The workspace packages use `workspace:*` internally, and
pnpm is the supported tool that rewrites those ranges for packed tarballs.

The authoritative final-SHA gate is:

```bash
pnpm run release:verify
```

It includes lint, types, unit and package tests, audit, size budgets, both
playgrounds, docs, browser tests, release identity, and packed-consumer checks.

Remote CI uses `pnpm run release:verify:library`. It validates the libraries,
playgrounds, textual documentation, package contracts, and browsers while
excluding the Ginko-backed docs app installation and build. The complete
docs-inclusive `release:verify` remains the authoritative maintainer-local gate
until the Ginko dependency is portable.

Do not publish these packages with `npm publish` from a workspace package
directory; it does not apply the same workspace dependency rewrite. A maintainer
publishes a confirmed version from a clean, synchronized `main` checkout with:

```bash
corepack pnpm run release:publish -- --confirm <version>
```

The guarded command runs the complete local release gate, creates verified
tarballs under `.release/v<version>`, checks npm authentication and registry
state, then publishes Vue before Nuxt. It can resume safely if Vue published but
Nuxt did not. Create the version tag and GitHub release only after both packages
are confirmed on npm.

## When code changes require doc changes

Update docs in the same change when you modify:

- public imports or package boundaries
- component props, composable signatures, or type contracts
- configuration defaults or stability guarantees
- examples used in the docs or READMEs
- measured bundle-size numbers referenced in public docs

If the change is breaking or high-friction, add a clear entry to `CHANGELOG.md` that explains the user impact and any required follow-up.

## Small fixes

Small fixes are welcome.

If you spot a typo, stale example, broken link, or unclear sentence, open a focused PR with the docs or test update directly. You do not need to batch unrelated cleanup into one change.
