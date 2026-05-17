# Changelog

All notable user-facing changes to this project will be documented in this file.

The format follows Keep a Changelog, with an `Unreleased` section at the top while the project is still moving quickly.

## [Unreleased]

### Breaking

- Removed the `@nuxt-photo/engine` package. Lightbox runtime state is now owned by the Vue layer through `@nuxt-photo/vue`.
- Removed public core collection helpers and the unused viewer state-machine exports.
- Removed `ImageContext = 'preload'`. Preloading now routes through the configured `ImageAdapter` with the existing `'slide'` context.
- Renamed `PhotoAdapter` to `PhotoMapper`.
- Renamed recipe props from `itemAdapter` / `:item-adapter` to `itemMapper` / `:item-mapper`.
- Renamed the lightbox ghost primitive from `LightboxPortal` to `LightboxGhostImage`.

### Changed

- Routed lightbox slide rendering, ghost-image transitions, and preloading through the configured `ImageAdapter`.
- Collapsed duplicated lightbox state ownership so Vue refs are the source of truth for open state, active index, gesture phase, pan/zoom state, and ghost transition state.
- Updated docs to describe only shipped behavior and remove framework-free engine, decode-timeout, aspect-ratio rejection, and universal primitive attribute-forwarding claims.

### Removed

- Removed export-name smoke tests and adapter/collection tests that only exercised plumbing.

### Fixed

- Fixed custom and Nuxt image adapters not being used consistently by lightbox preloading and transition image loading.

## [0.1.0] - 2026-04-26

### Added

- Added `@nuxt-photo/engine` as a framework-free lightbox orchestration package for work below the Vue layer.
- Added a stable `useLightboxProvider`-first customization path for building custom lightbox UIs with Vue primitives.
- Added MIT license metadata for the public package set.
- Added a pnpm-based release pack smoke check.

### Changed

- Changed advanced Vue customization to use the root `@nuxt-photo/vue` entrypoint plus `@nuxt-photo/engine` instead of a separate `/extend` API.
- Changed `PhotoAlbum` internals to render through dedicated view components for rows, SSR snapshots, SSR fallback, and mounted layouts.
- Changed the public stability contract to treat package root entrypoints as the stable surface and undocumented exports as internal.
- Changed the Node.js support floor to `>=20.19.0 || >=22.12.0` to match the Nuxt 4 toolchain.
- Updated Embla dependencies to the current `9.0.0-rc02` prerelease line.

### Removed

- Removed `@nuxt-photo/vue/extend`.
- Removed injected lightbox slot-override plumbing in favor of the root Vue API and global lightbox component overrides.

### Fixed

- Fixed image decode failure handling so failed entries are evicted consistently and surface a dev warning instead of failing silently.
- Fixed lightbox active-photo preservation when a photo list reorders or changes while open.
- Fixed body scroll locking so inactive lightbox providers cannot release another provider's lock.
- Fixed missing `openById` calls so they no-op with a dev warning instead of opening the first photo.
- Fixed invalid columns and masonry inputs to return safe layouts instead of invalid dimensions.
- Fixed the built-in lightbox dialog to expose an accessible name.
- Fixed public docs and playground examples that used stale or invalid APIs.

## [0.0.1] - 2026-03-23

### Added

- Initial public preview release of the Nuxt Photo package set and Nuxt module.
