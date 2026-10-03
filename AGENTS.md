# Working on Nuxt Photo

Follow the [Lupinum OSS handbook](https://oss.lupinum.com) for repository security,
dependencies and releases. [CONTRIBUTING.md](CONTRIBUTING.md) explains local work.
Read [docs/WRITING.md](docs/WRITING.md) before changing public prose.

## Commands

`pnpm install --frozen-lockfile` installs the declared toolchain. `pnpm dev`
starts the playground; `pnpm dev:docs` starts the documentation app. `pnpm verify` is the complete local and CI gate. Use `pnpm test`,
`pnpm typecheck`, `pnpm test:packed` or `pnpm test:browser` for focused checks.

## Contracts

- `packages/vue` owns photo components, layouts, composables and styles.
  `packages/nuxt` owns Nuxt registration and app exports. Preserve public
  gallery, image, lightbox and accessibility behavior.
- Keep Vite+ for formatting, general lint and tests. Vue template ESLint,
  `vue-tsc`, Nuxt preparation, Module Builder and `unbuild` cover contracts
  the general checker cannot. Read installed `node_modules/vite-plus/docs`
  before changing Vite+ commands.
- The public packages use one Changesets fixed group. Nuxt's packed dependency
  equals the Vue candidate version; publish Vue first. Public package changes
  need a Changeset. Maintenance changes do not need a version bump.
- Packed tests install outside the workspace, cover the declared framework
  floors and current versions, and check conflicting sibling resolution.
  Fixture setup and missing output are failures, never silent skips.
- Versions, exports, commands and dependency policy belong in their manifests.
  Keep pnpm's 24-hour quarantine; there is no scope-wide exemption.
- Do not edit generated `dist`, `release`, `.nuxt` or `.output` by hand.
  Tarball dependencies belong only in disposable test consumers.
- Publication uses `release.yml`, the protected `npm` environment and trusted
  publishing. Never publish locally, add npm tokens or rebuild in the publish
  job. GitHub Actions use full commit SHAs and job-scoped permissions.
