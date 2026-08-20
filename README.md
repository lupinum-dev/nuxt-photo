<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/icon-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/public/icon-light.svg">
    <img src="docs/public/icon-light.svg" width="128" alt="Nuxt Photo icon">
  </picture>
</p>

<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/public/wordmark-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="docs/public/wordmark-light.svg">
    <img src="docs/public/wordmark-light.svg" width="256" alt="Nuxt Photo">
  </picture>
</h1>

<p align="center">Build responsive photo galleries, shared lightboxes, and carousels from one predictable photo model.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lupinum/nuxt-photo"><img src="https://img.shields.io/npm/v/@lupinum/nuxt-photo?color=00DC82" alt="npm version"></a>
  <a href="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml"><img src="https://github.com/lupinum-dev/nuxt-photo/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-00DC82" alt="MIT license"></a>
  <a href="https://discord.gg/RPH6SeA36N"><img src="https://img.shields.io/badge/Discord-18181B?logo=discord" alt="Discord"></a>
  <a href="https://deepwiki.com/lupinum-dev/nuxt-photo"><img src="https://deepwiki.com/badge.svg" alt="Ask DeepWiki"></a>
</p>

> [!WARNING]
> Nuxt Photo is pre-1.0. Review the changelog before each upgrade.

## Why use Nuxt Photo?

Nuxt Photo gives albums, carousels, and custom triggers one shared photo model and one lightbox. It uses known image dimensions to create stable layouts during server rendering. You can start with complete components and use lower-level Vue primitives when you need a custom interface.

You do not need to connect separate gallery, carousel, gesture, focus, and lightbox libraries.

## When to use it

Use Nuxt Photo when your application has image URLs, stable IDs, widths, and heights. It is useful when you need accessible keyboard and gesture controls, server-rendered layouts, or optional Nuxt Image providers.

Nuxt Photo is not suitable when you only need a plain image grid. It is also not an image CMS, optimizer, or asset pipeline.

## Requirements

- Node.js 22.18 or 24.11 and later maintenance releases
- Nuxt 4.4.8 or later for `@lupinum/nuxt-photo`
- Vue 3.5 or later for `@lupinum/vue-photo`
- Image dimensions before render

## Installation

Install the Nuxt package:

```bash
pnpm add @lupinum/nuxt-photo
```

Add the module:

```ts
export default defineNuxtConfig({
  modules: ['@lupinum/nuxt-photo'],
  nuxtPhoto: {
    css: 'all',
  },
})
```

The default `css: 'structure'` option includes layout CSS only. Use `css: 'all'` for the included visual theme.

## Quick start

```vue
<script setup lang="ts">
import type { PhotoItem } from '@lupinum/nuxt-photo/app'

const photos: PhotoItem[] = [
  {
    id: 'landscape',
    src: '/photos/landscape.jpg',
    width: 1280,
    height: 800,
    alt: 'A mountain landscape',
  },
  {
    id: 'portrait',
    src: '/photos/portrait.jpg',
    width: 960,
    height: 1200,
    alt: 'A portrait photograph',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Select a photo to open the shared lightbox. The same array works with albums, groups, carousels, and custom triggers.

## Discord

Join the Lupinum OSS community to discuss Nuxt Photo, ask questions, and share
what you build.

<p align="center">
  <a href="https://discord.gg/RPH6SeA36N">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="docs/public/discord-dark.svg">
      <source media="(prefers-color-scheme: light)" srcset="docs/public/discord-light.svg">
      <img src="docs/public/discord-light.svg" width="500" alt="Join the Lupinum OSS Discord">
    </picture>
  </a>
</p>

## Core concepts

- Known dimensions prevent layout shifts before images load.
- One provider coordinates focus, keyboard controls, gestures, and transitions.
- Ready-made components cover common photo experiences.
- Vue composables and primitives support custom lightbox interfaces.
- Nuxt Image integration is optional. Native image rendering remains available.

## Packages

- [`@lupinum/nuxt-photo`](./packages/nuxt/README.md) provides the Nuxt module, auto-imports, components, and CSS integration.
- [`@lupinum/vue-photo`](./packages/vue/README.md) provides framework-level Vue components, composables, types, and utilities.

Nuxt applications normally install only `@lupinum/nuxt-photo`.

## Documentation

Read the [Nuxt Photo documentation](https://nuxt-photo.lupinum.com). Start with the [installation guide](https://nuxt-photo.lupinum.com/docs/getting-started/installation).

The [changelog](./CHANGELOG.md) records release changes.

## Contributing and development

Read [CONTRIBUTING.md](./CONTRIBUTING.md) before you open a pull request. Maintainers use [MAINTAINING.md](./MAINTAINING.md) for dependency updates, releases, rollback, and incident response.

Run the normal handoff gate before you request review:

```bash
pnpm verify
```

## Support and security

Open a [GitHub issue](https://github.com/lupinum-dev/nuxt-photo/issues) for bugs and focused feature requests. Join the [Lupinum OSS Discord](https://discord.gg/RPH6SeA36N) for community support.

Do not report vulnerabilities in public issues. Follow [SECURITY.md](./SECURITY.md) to send a private report.

## License

Nuxt Photo is developed by [Lupinum OG](https://lupinum.com) and released under the [MIT License](./LICENSE).
