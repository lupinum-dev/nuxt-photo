# Nuxt Photo

Photo galleries, lightboxes, and carousels for Nuxt apps with real image data.

Nuxt Photo is for teams that already know each photo's `src`, `width`, and
`height`, and want predictable layouts, shared lightbox behavior, keyboard and
gesture handling, SSR-friendly rendering, and optional `@nuxt/image` support
without wiring separate gallery, carousel, and lightbox libraries together.

## At a glance

- Nuxt 4 module with auto-registered gallery and carousel components
- Ready-to-use `<PhotoAlbum>`, `<PhotoGroup>`, `<Photo>`, and `<PhotoCarousel>`
- Built-in shared lightbox with transitions, captions, keyboard, pointer, and
  gesture handling
- Rows, columns, and masonry album layouts from framework-free Vue package logic
- Native image fallback, with provider-backed `@nuxt/image` rendering when the
  Nuxt Image module is installed
- Structure-only CSS by default, with optional theme CSS when you want the
  bundled visual styling
- Lower-level Vue primitives and composables for custom lightbox UI

## Use it when

- your app has photo metadata with stable IDs, source URLs, widths, and heights
- you want album layouts that do not wait for every image to load before sizing
- you need one shared lightbox across galleries, groups, or custom triggers
- you want Nuxt module ergonomics but still need access to lower-level Vue
  primitives for advanced cases

## Skip it when

- you only need a plain `<img>` grid with no lightbox, carousel, or layout logic
- you do not know image dimensions and cannot derive them before rendering
- you need a headless image CMS, optimizer, or asset pipeline rather than UI
  components and layout helpers

## Install

```bash
pnpm add @nuxt-photo/nuxt
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

For a styled first pass, add `nuxtPhoto: { css: 'all' }`. The default
`css: 'structure'` keeps only the layout and geometry CSS for apps that provide
their own theme.

Add `@nuxt/image` later when you want Nuxt Image provider integration:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt', '@nuxt/image'],
})
```

## Smallest working example

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/nuxt/app'

const photos: PhotoItem[] = [
  {
    id: 'landscape',
    src: 'https://picsum.photos/id/1018/1280/800',
    width: 1280,
    height: 800,
    alt: 'Sample landscape photo',
  },
  {
    id: 'portrait',
    src: 'https://picsum.photos/id/1015/960/1200',
    width: 960,
    height: 1200,
    alt: 'Sample vertical photo',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Clicking a photo opens the built-in lightbox. The same photo model works for
albums, groups, carousels, and custom lightbox triggers.

## Package map

- `@nuxt-photo/nuxt` is the Nuxt module. Nuxt apps install only this package.
  App/runtime imports use `@nuxt-photo/nuxt/app`.
- `@nuxt-photo/vue` is the Vue library. Plain Vue apps install this package for
  components, composables, primitives, styles, common types, and photo helpers.

## Public API and stability

Nuxt Photo is pre-1.0. The stable public surface is the documented root exports
from `@nuxt-photo/vue`, the Nuxt module entry `@nuxt-photo/nuxt`, and the Nuxt
app entry `@nuxt-photo/nuxt/app`.

Generated files, deep imports, and undocumented exports are internal even if
they are visible in the package output.

## Links

- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/installation)
- [Live examples](https://nuxt-photo.lupinum.com)
- [Nuxt package guide](./packages/nuxt/README.md)
- [Vue package guide](./packages/vue/README.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)
- [Maintainer and release guide](./MAINTAINING.md)
- [Security policy](./SECURITY.md)
