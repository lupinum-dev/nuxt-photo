<p align="center">
  <img src="https://raw.githubusercontent.com/lupinum-dev/nuxt-photo/main/docs/public/icon.png" width="128" alt="Nuxt Photo icon">
</p>

<h1 align="center">@lupinum/nuxt-photo</h1>

<p align="center">Add Nuxt Photo components, auto-imports, and CSS integration through one Nuxt module.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lupinum/nuxt-photo"><img src="https://img.shields.io/npm/v/@lupinum/nuxt-photo?color=00DC82" alt="npm version"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml"><img src="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
</p>

> [!WARNING]
> Nuxt Photo 1.0 is in beta. Install it from the `next` npm tag and review the
> [0.2 to 1.0 upgrade guide](https://nuxt-photo.lupinum.com/docs/help/upgrade-to-1).

## Purpose

Use this package for the standard Nuxt experience. It registers the recipe components, imports common helpers, loads the selected CSS profile, and can connect to Nuxt Image.

## Requirements

- Node.js 22.18 or 24.11 and later maintenance releases
- Nuxt 4.4.8 or later
- Known width and height values for each photo

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
- `@lupinum/nuxt-photo/app` exports runtime types and helpers.
- Auto-imports include `useLightbox`, `provideLightbox`, `usePhotoLabels`, and `responsive`.

Install `@nuxt/image` separately when you need provider-backed image rendering. Nuxt Photo also works with native images.

App-wide lightbox labels can be localized through the typed `nuxtPhoto.labels` module option or the `nuxtPhoto.labels` key in `app.config.ts`. Indexed labels support `{index}` and slide announcements also support `{count}`.

## Documentation

Read the [Nuxt Photo documentation](https://nuxt-photo.lupinum.com) and the [root README](https://github.com/lupinum-dev/nuxt-photo#readme).

## Support and security

Use [GitHub issues](https://github.com/lupinum-dev/nuxt-photo/issues) or the [Lupinum OSS Discord](https://discord.gg/RPH6SeA36N) for support. Report vulnerabilities through the [private security process](https://github.com/lupinum-dev/nuxt-photo/security/policy).

## License

Released by [Lupinum OG](https://lupinum.com) under the [MIT License](https://github.com/lupinum-dev/nuxt-photo/blob/main/LICENSE).
