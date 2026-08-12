# @lupinum/nuxt-photo

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
