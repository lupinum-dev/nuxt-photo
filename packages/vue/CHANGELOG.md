# @lupinum/vue-photo

## 1.0.0-rc.1

### Patch Changes

- Use the resolved localization source for both visible counters and screen-reader announcements, and align the carousel playground and browser acceptance coverage with the default lightbox and flat carousel API.

## 1.0.0-rc.0

### Major Changes

- 397cfee: Prepare the 1.0 release candidate around five complete recipe components, optional headless primitives, and one shared reactive lightbox contract.

  Make lightboxes default across recipes; expose consistent recipe controllers; rename `useLightboxProvider()` to `provideLightbox()`; flatten carousel behavior props; add reactive Vue and serializable Nuxt localization; support reactive validation, transitions, adapters, and placeholders; and publish only explicit component, primitive, type, composable, provide, and stylesheet subpaths.

  Make layout calculation deterministic with exact row optimization and shared JavaScript/CSS geometry, move the carousel to stable Embla 8.6.0, and split transition orchestration by responsibility.

  Simplify the Nuxt module to four build-time option roots, load the complete theme by default, keep UI defaults in typed AppConfig, and keep image adapter configuration in `nuxt.config.ts` with quiet native fallback when Nuxt Image is absent.

## 0.2.1

### Patch Changes

- [#20](https://github.com/lupinum-dev/nuxt-photo/pull/20) [`f9149eb`](https://github.com/lupinum-dev/nuxt-photo/commit/f9149eb6d4aae5f26ab27a1a2e533fead1d790f3) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Clarify the package status in the npm README.

## 0.2.0

### Breaking

- `LightboxRoot` now owns the FLIP transition visual. Custom lightboxes must
  remove `LightboxGhostImage` and `mediaOpacity` slot bindings.
- Replaced `--np-backdrop-blur` with `--np-backdrop-filter`.
- Photo IDs are required non-empty strings, and public photo and controller
  models are readonly.
- Removed `PhotoMapper`, `itemMapper`, `photoId`, object-identity opening,
  `openPhoto`, raw Embla options and plugins, and duplicate album layout props.
- `PhotoGroup` now requires one explicit `photos` collection.
- Carousel and autoplay props now use library-owned option types.
- Provider configuration is setup-time and requires a remount to change.
- Raised the Node.js 22 support floor to 22.18 and defined Node 24 as the
  maintainer runtime.

### Changed

- Replaced reactive ghost-image choreography with one WAAPI motion controller.
- Limited initial lightbox media mounting to active and adjacent slides.
- Centralized lifecycle intent, abortable transitions, modal and body-scroll
  ownership, gesture sessions, and pan and zoom orchestration.
- Derived carousel controls from Embla's geometry-dependent snap registry.
- Added structured validation at public photo boundaries.
- Ensured that only one lightbox owns focus and page isolation at a time.

### Removed

- Removed the framework-free engine package, compatibility paths, automatic
  `PhotoGroup` collection, public vendor types, private helper exports, and
  obsolete test scaffolding.

### Fixed

- Prevented responsive thumbnail-to-slide handoffs from briefly darkening.
- Fixed lifecycle interruption, stale intent, and cross-provider modal races.
- Fixed group registration ordering and carousel snap mismatches.
- Fixed rejected lifecycle promises in built-in interactions.
- Fixed package export condition ordering so TypeScript declarations resolve
  before JavaScript imports.

## 0.1.2

### Added

- Added the `useLightboxProvider`-first customization path for advanced
  lightbox interfaces.
- Added MIT license metadata and packed-package verification.

### Changed

- Moved advanced customization to the root Vue package entrypoint.
- Split photo-album rendering into dedicated rows, SSR snapshot, fallback, and
  mounted layout views.
- Defined package root entrypoints as the supported public surface.
- Raised the Node.js support floor to match the Nuxt 4 toolchain.
- Updated the Embla integration to the `9.0.0-rc02` release line.

### Removed

- Removed `@lupinum/vue-photo/extend`.
- Removed injected lightbox slot-override plumbing in favor of root exports and
  global lightbox component overrides.

### Fixed

- Fixed image decode failure handling and active-photo preservation.
- Fixed body-scroll ownership and missing `openById` behavior.
- Fixed invalid columns and masonry inputs.
- Added an accessible name to the built-in lightbox dialog.

## 0.0.1

- Initial public preview of the Vue photo components, composables, layouts,
  lightbox primitives, and styles.
