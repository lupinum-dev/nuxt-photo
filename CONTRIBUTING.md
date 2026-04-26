# Contributing

Thanks for contributing to Nuxt Photo.

This repo has five library packages, two playground apps, and a docs app. The most reliable way to make a good change is to work against the smallest surface that proves the behavior, then run the same checks the repo uses in CI.

## What kinds of contributions help

- Bug fixes in the Nuxt module, recipes, Vue primitives, engine, or core helpers
- Documentation improvements for the README, docs site, package READMEs, changelog entries, or contributor workflow
- Tests that lock down a bug, regression, or edge case
- Focused performance or bundle-size improvements with a measurable payoff

## Prerequisites

- Node.js `>=20.19.0 || >=22.12.0`
- `pnpm` `10.x`

The repo declares both in the root [`package.json`](./package.json).

## Repo layout

The main workspaces are:

- `packages/core` — framework-free layout, geometry, image, and transition helpers
- `packages/engine` — framework-free lightbox orchestration
- `packages/vue` — Vue composables and primitives
- `packages/recipes` — ready-to-use components and styles
- `packages/nuxt` — Nuxt module integration
- `playground` — main demo app used for development and e2e coverage
- `playground-tailwind` — Tailwind-focused demo app
- `docs` — the public docs app
- `docs/content/docs` — the active docs site content
- `test/fixtures` — shared test helpers

## Setup

Clone the repo, install dependencies, and build the packages once:

```bash
git clone https://github.com/lupinum-dev/nuxt-photo.git
cd nuxt-photo
pnpm install
pnpm build
```

`pnpm build` compiles the workspace packages in dependency order: `core` → `engine` → `vue` → `recipes` → `nuxt`.

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

Main checks:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:module-package
pnpm size
pnpm release:pack
```

Use these when needed:

```bash
pnpm test:e2e
pnpm build:docs
pnpm build:playground
```

Notes:

- `pnpm test:e2e` builds the main playground first and then runs Playwright.
- `pnpm size` is the source of truth for documented size numbers.
- `pnpm release:pack` packs every public workspace package with pnpm and verifies rewritten workspace dependencies and tarball metadata.
- `pnpm test` includes e2e, so it is heavier than the normal pre-PR loop.

## Release dry run

Use pnpm for packaging and publishing. The workspace packages use `workspace:*`
internally, and pnpm is the supported tool that rewrites those ranges for
packed/published tarballs.

Before publishing:

```bash
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:module-package
pnpm size
pnpm build:playground
pnpm --filter nuxt-photo-playground-tw build
pnpm build:docs
pnpm test:e2e
pnpm release:pack
```

Do not publish these packages with `npm publish` from a workspace package
directory; it does not apply the same workspace dependency rewrite.

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
