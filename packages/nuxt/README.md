<p align="center">
  <img src="https://raw.githubusercontent.com/lupinum-dev/nuxt-photo/main/docs/public/icon.png" width="128" alt="Nuxt Photo icon">
</p>

<h1 align="center">@lupinum/nuxt-photo</h1>

<p align="center">Photo albums, carousels and a lightbox for Nuxt, with images sized to the layout through Nuxt Image.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lupinum/nuxt-photo"><img src="https://img.shields.io/npm/v/@lupinum/nuxt-photo?color=00DC82" alt="npm version"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml"><img src="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
</p>

> [!WARNING]
> Nuxt Photo 1.0 is in beta. Install it from the `next` npm tag.

## Purpose

Use this package for the standard Nuxt experience. It registers the components, auto-imports the helpers, loads the CSS, and uses Nuxt Image when it is installed.

## Requirements

- Node.js 22.18 or 24.11 and later maintenance releases
- Nuxt 4.4.8 or later
- The pixel width and height of each photo, or `localImages: true` for files in `public/`

## Installation

```bash
pnpm add @lupinum/nuxt-photo@next
```

```ts
export default defineNuxtConfig({
  modules: ['@lupinum/nuxt-photo'],
  nuxtPhoto: { css: 'all' },
})
```

## Quick start

```vue
<script setup lang="ts">
import type { PhotoItem } from '@lupinum/nuxt-photo/app'

const photos: PhotoItem[] = [
  { id: 'one', src: '/one.jpg', width: 1200, height: 800, alt: 'First photo' },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

## Exports

- `@lupinum/nuxt-photo` exports the Nuxt module.
- `@lupinum/nuxt-photo/app` exports the components, types and helpers for
  explicit imports.
- Auto-imports: `useLightbox`, `usePhotoLabels`, `usePhotoFolder` and
  `responsive`.

With `@nuxt/image` installed, images use its provider, `screens` and quality.
Without it, images use the photo's own `src`.

Configure everything in `nuxtPhoto` in `nuxt.config.ts`. Labels follow the
active `@nuxtjs/i18n` locale; ten languages are bundled.

## Documentation

Read the [Nuxt Photo documentation](https://nuxt-photo.lupinum.com) and the [root README](https://github.com/lupinum-dev/nuxt-photo#readme).

## Support and security

Use [GitHub issues](https://github.com/lupinum-dev/nuxt-photo/issues) or the [Lupinum OSS Discord](https://discord.gg/RPH6SeA36N) for support. Report vulnerabilities through the [private security process](https://github.com/lupinum-dev/nuxt-photo/security/policy).

## License

Released by [Lupinum OG](https://lupinum.com) under the [MIT License](https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE).
