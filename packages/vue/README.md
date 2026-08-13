<p align="center">
  <img src="https://raw.githubusercontent.com/lupinum-dev/nuxt-photo/main/docs/public/icon.png" width="128" alt="Nuxt Photo icon">
</p>

<h1 align="center">@lupinum/vue-photo</h1>

<p align="center">Build custom Vue photo experiences with shared lightbox state, components, composables, and utilities.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lupinum/vue-photo"><img src="https://img.shields.io/npm/v/@lupinum/vue-photo?color=42B883" alt="npm version"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml"><img src="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
</p>

> [!WARNING]
> This package is pre-1.0. The first scoped `0.2.0` release is in preparation.

## Purpose

Use this package in plain Vue applications or when a Nuxt interface needs lower-level control. It provides the state and primitives behind the Nuxt Photo recipe components.

## Requirements

- Node.js 22.18 or 24.11 and later maintenance releases
- Vue 3.5 or later
- Known width and height values for each photo

## Installation

```bash
pnpm add @lupinum/vue-photo
```

## Quick start

```ts
import { useLightboxProvider, type PhotoItem } from '@lupinum/vue-photo'

const photos: PhotoItem[] = [
  { id: 'one', src: '/one.jpg', width: 1200, height: 800, alt: 'First photo' },
]

const lightbox = useLightboxProvider(photos, {
  transition: 'auto',
})
```

The provider creates the shared state that the Vue lightbox primitives consume.

## Exports

- Composables include `useLightbox`, `useLightboxProvider`, `useContainerWidth`, and `responsive`.
- Components include `LightboxProvider`, `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `PhotoTrigger`, and `PhotoImage`.
- The package also exports public photo types, injection keys, and CSS.

Use documented entry points only. Generated files and undocumented deep imports are internal.

## Documentation

Read the [Vue API documentation](https://nuxt-photo.lupinum.com/docs/api/composables) and the [root README](https://github.com/lupinum-dev/nuxt-photo#readme).

## Support and security

Use [GitHub issues](https://github.com/lupinum-dev/nuxt-photo/issues) or the [Lupinum OSS Discord](https://discord.gg/RPH6SeA36N) for support. Report vulnerabilities through the [private security process](https://github.com/lupinum-dev/nuxt-photo/security/policy).

## License

Released by [Lupinum OG](https://lupinum.com) under the [MIT License](https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE).
