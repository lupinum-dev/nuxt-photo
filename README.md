# Nuxt Photo

Nuxt Photo gives Nuxt apps photo albums, a shared lightbox, a carousel, and advanced lightbox building blocks from one module.

Use it when you have real photo data (`id`, `src`, `width`, and `height`) and want stable gallery layouts, an honest SSR story, and native, Nuxt Image, or custom image adapters without stitching together separate gallery and lightbox libraries.

## Smallest working example

Install the module:

```bash
pnpm add @nuxt-photo/nuxt
```

Register it in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

Render a gallery:

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/nuxt'

const photos: PhotoItem[] = [
  {
    id: 'desert',
    src: '/photos/desert.jpg',
    width: 1280,
    height: 800,
    alt: 'Desert at golden hour',
  },
  {
    id: 'ocean',
    src: '/photos/ocean.jpg',
    width: 960,
    height: 1200,
    alt: 'Ocean waves at dusk',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Click any photo and the built-in lightbox opens with gestures, keyboard support, and transition handling already wired up.

## Packages

Nuxt Photo is split into four packages:

- `@nuxt-photo/nuxt` for the Nuxt module, auto-imports, and CSS wiring
- `@nuxt-photo/recipes` for ready-to-use components like `<PhotoAlbum>` and `<PhotoCarousel>`
- `@nuxt-photo/vue` for advanced lightbox building blocks and composables like `useLightboxProvider`
- `@nuxt-photo/core` for framework-free layout, geometry, and image helpers

## Stability

Nuxt Photo is pre-1.0.

- Root imports from `@nuxt-photo/core`, `@nuxt-photo/vue`, `@nuxt-photo/recipes`, and `@nuxt-photo/nuxt` are the stable public surface.
- Undocumented exports are internal, even if they are visible in generated output today.

## Where next

- [Documentation site](https://nuxt-photo.lupinum.com/docs/getting-started/introduction)
- [Live examples](https://nuxt-photo.lupinum.com)
- [Package guide for `@nuxt-photo/nuxt`](./packages/nuxt/README.md)
- [Package guide for `@nuxt-photo/vue`](./packages/vue/README.md)
- [Package guide for `@nuxt-photo/recipes`](./packages/recipes/README.md)
- [Package guide for `@nuxt-photo/core`](./packages/core/README.md)
- [Changelog](./CHANGELOG.md)
- [Contributing](./CONTRIBUTING.md)
