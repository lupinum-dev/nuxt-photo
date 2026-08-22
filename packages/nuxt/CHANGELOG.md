# @lupinum/nuxt-photo

## 1.0.0-beta.2

### Patch Changes

- [#45](https://github.com/lupinum-dev/nuxt-photo/pull/45) [`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Honor Nuxt app-config-only photo defaults, preserve nested image settings, and localize carousel triggers. Harden collection registration, responsive placeholder resets, strict photo revalidation, metadata-safe layouts, and cancellation of overlapping lightbox animations.

- Updated dependencies [[`62fc815`](https://github.com/lupinum-dev/nuxt-photo/commit/62fc815e353a37893ee575c566eb1f65493af898)]:
  - @lupinum/vue-photo@1.0.0-beta.2

## 1.0.0-beta.1

### Major Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Replace the prerelease Embla integration with stable Embla 8.6 and its documented public methods. `PhotoCarousel` now accepts direct `loop`, `dragFree`, and `direction` props. Remove the `options` bag, `slidesToScroll`, and the private snap-model integration. Carousel lightboxes remain opt-in.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Finalize the 1.0 lightbox contract. Rename `useLightboxProvider()` to `provideLightbox()` and `LightboxDefaults` to `PhotoDefaults` without compatibility aliases. Export `LightboxHandle` and expose it only from `PhotoAlbum` and `PhotoGroup`. Transition props now rebuild from immutable defaults when changed or cleared, and live reduced-motion changes flow through animation timing.

### Minor Changes

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add optional `placeholderSrc` previews to `PhotoItem` and `ImageSource`. Placeholders reset whenever the adapter-resolved URL changes and remain visible after load failures. `PhotoAlbum.sizes` now also accepts a native HTML sizes string for every layout.

- [#36](https://github.com/lupinum-dev/nuxt-photo/pull/36) [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc) Thanks [@Mat4m0](https://github.com/Mat4m0)! - Add typed Nuxt app configuration and complete module-level localization. Module options now preserve app-owned image, lightbox, and label values that they do not replace. Automatic native-image fallback remains quiet; warnings are limited to explicit adapter settings that cannot work.

### Patch Changes

- Updated dependencies [[`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc), [`d93238b`](https://github.com/lupinum-dev/nuxt-photo/commit/d93238bec66ed1d33d687d165c9bfa9a0c5f71bc)]:
  - @lupinum/vue-photo@1.0.0-beta.1

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
