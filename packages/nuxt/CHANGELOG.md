# @lupinum/nuxt-photo

## 1.0.0-beta.1

### Patch Changes

- Use the resolved localization source for both visible counters and screen-reader announcements, and align the carousel playground and browser acceptance coverage with the default lightbox and flat carousel API.
- Updated dependencies
  - @lupinum/vue-photo@1.0.0-beta.1

## 1.0.0-beta.0

### Major Changes

- 397cfee: Prepare the 1.0 release candidate around five complete recipe components, optional headless primitives, and one shared reactive lightbox contract.

  Make lightboxes default across recipes; expose consistent recipe controllers; rename `useLightboxProvider()` to `provideLightbox()`; flatten carousel behavior props; add reactive Vue and serializable Nuxt localization; support reactive validation, transitions, adapters, and placeholders; and publish only explicit component, primitive, type, composable, provide, and stylesheet subpaths.

  Make layout calculation deterministic with exact row optimization and shared JavaScript/CSS geometry, move the carousel to stable Embla 8.6.0, and split transition orchestration by responsibility.

  Simplify the Nuxt module to four build-time option roots, load the complete theme by default, keep UI defaults in typed AppConfig, and keep image adapter configuration in `nuxt.config.ts` with quiet native fallback when Nuxt Image is absent.

### Patch Changes

- Updated dependencies [397cfee]
  - @lupinum/vue-photo@1.0.0-beta.0

## 0.2.1

### Patch Changes

- [#20](https://github.com/lupinum-dev/nuxt-photo/pull/20) [`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify the package status in the npm README.

- Updated dependencies [[`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3)]:
  - @lupinum/vue-photo@0.2.1

## 0.2.0

### Breaking

- Removed the old framework-free engine and compatibility surfaces.
- Aligned the module with required photo IDs, explicit `PhotoGroup`
  collections, readonly public models, and the new Vue customization contract.
- Set Nuxt 4.4.8 as the minimum supported and certified Nuxt release.
- Raised the Node.js 22 support floor to 22.18 and defined Node 24 as the
  maintainer runtime.

### Changed

- Validate unknown Nuxt module options at setup time with structured,
  namespaced errors.
- Keep Embla internal to the Vue package instead of exposing vendor types.

### Fixed

- Fixed the packed runtime export for `PhotoValidationError`.
- Expanded package consistency and packed-consumer coverage.
- Fixed package export condition ordering so TypeScript declarations resolve
  before JavaScript imports.

## 0.1.2

### Added

- Added MIT license metadata and packed-package verification.

### Changed

- Defined package root entrypoints as the supported public surface.
- Raised the Node.js support floor to match the Nuxt 4 toolchain.
- Kept the Nuxt module aligned with the Vue package's supported customization
  surface.

### Fixed

- Fixed public examples and package-consumer coverage for the Nuxt module.

## 0.0.1

- Initial public preview of the Nuxt Photo module and runtime integration.
