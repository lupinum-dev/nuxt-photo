# Changelog

All notable user-facing changes to this project will be documented in this file.

The format follows Keep a Changelog, with an `Unreleased` section at the top while the project is still moving quickly.

## [Unreleased]

### Added

- Added `@nuxt-photo/engine` as a framework-free lightbox orchestration package for work below the Vue layer.
- Added a stable `useLightboxProvider`-first customization path for building custom lightbox UIs with Vue primitives.

### Changed

- Changed advanced Vue customization to use the root `@nuxt-photo/vue` entrypoint plus `@nuxt-photo/engine` instead of a separate `/extend` API.
- Changed `PhotoAlbum` internals to render through dedicated view components for rows, SSR snapshots, SSR fallback, and mounted layouts.
- Changed the public stability contract to treat package root entrypoints as the stable surface and undocumented exports as internal.

### Removed

- Removed `@nuxt-photo/vue/extend`.
- Removed injected lightbox slot-override plumbing in favor of the root Vue API and global lightbox component overrides.

### Fixed

- Fixed image decode failure handling so failed entries are evicted consistently and surface a dev warning instead of failing silently.

## [0.0.1] - 2026-03-23

### Added

- Initial public preview release of the Nuxt Photo package set and Nuxt module.
