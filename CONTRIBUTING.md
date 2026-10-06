# Contributing

Nuxt Photo has a Vue package, a Nuxt module, a playground and a documentation
app. `demo/` holds the photo set both apps share. Keep changes focused on
observable consumer behavior.

## Setup and development

Use the Node version in `.node-version` and the pnpm version in `package.json`.

```sh
corepack enable pnpm
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm docs:dev` for the public examples, including the Tailwind lightbox in
`docs/app/examples`. Stop only processes you started.

## Verification

```sh
pnpm test
pnpm lint
pnpm typecheck
pnpm test:packed
pnpm test:browser
pnpm verify
```

The complete gate keeps Vue/Nuxt compiler checks, unit and SSR behavior,
Vue-template lint, clean tarball consumers, bundle-size budgets, the playground,
documentation and browser tests. `vp check` cannot replace the framework
compilers. Packed consumers test Vue/Nuxt peer floors and current versions,
public declarations and exports, and a Nuxt-only install with a conflicting Vue
sibling. They do not use workspace aliases.

Run the focused checks affected by a change, then the complete gate once before
handoff. Browser runtimes can be installed with
`pnpm exec playwright install chromium firefox webkit`. `pnpm size --analyze`
explains size-budget changes. Fixture setup failures must fail the check.

## Packages and dependencies

Public behavior belongs in `packages/*/src`, with tests in `packages/*/test`.
Use declared exports; do not document deep imports. Keep runtime dependencies
external so packed consumers catch missing declarations. Declare each dependency
where it is imported and preserve verified peer ranges. The lockfile, quarantine
and install-script allowlist are authoritative.

Add a Changeset for a user-visible change to either package. They share one
fixed release group. Start its summary with Fix, Add, Remove or Change; a major
change includes a `Migration:` paragraph. Do not edit versions or generated
changelog headings by hand.

## Documentation and release

Edit public pages in `docs/content/docs`, follow [docs/WRITING.md](docs/WRITING.md),
and run `pnpm docs:build`: it checks routes, API examples and references before
building. `pnpm build` also copies the built pages into each package as its agent
docs (`./agent-docs`). Inspect changed interactive
examples at desktop and narrow widths.

The [OSS handbook](https://oss.lupinum.com/docs/releasing) owns the release
procedure. CI checks one required status, `ci`. `release.yml` prepares a Version
packages PR with read-only dependency execution, then packs without publishing
credentials and publishes approved tarballs through the `npm` environment.
`preview.yml` provides pkg.pr.new pull-request packages. Vercel's Git integration
builds documentation and previews; no deployment token is needed in GitHub.

Report undisclosed vulnerabilities through [SECURITY.md](SECURITY.md).
