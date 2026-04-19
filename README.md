# Nuxt Photo

Nuxt Photo is a Nuxt-native photo gallery and lightbox system built for responsive layouts, SSR-safe rendering, image-provider integration, and headless customization.

It is split into four packages:

- `@nuxt-photo/core` for framework-free layout, image, and gesture logic
- `@nuxt-photo/vue` for Vue composables and primitives
- `@nuxt-photo/recipes` for ready-to-use components
- `@nuxt-photo/nuxt` for the Nuxt module and auto-import experience

## Install

```bash
pnpm add @nuxt-photo/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

Optional but recommended:

```bash
pnpm add @nuxt/image
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
})
```

## Quickstart

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

const photos: PhotoItem[] = [
  { id: '1', src: '/photos/a.jpg', width: 1280, height: 800, alt: 'Sunrise' },
  { id: '2', src: '/photos/b.jpg', width: 960, height: 1200, alt: 'Canyon' },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

## Package guide

- [`@nuxt-photo/nuxt`](./packages/nuxt/README.md) for Nuxt 4 apps
- [`@nuxt-photo/recipes`](./packages/recipes/README.md) for high-level components
- [`@nuxt-photo/vue`](./packages/vue/README.md) for primitives and composables
- [`@nuxt-photo/core`](./packages/core/README.md) for framework-free logic

## Status

Nuxt Photo is pre-1.0. The root package entry points are the intended stable public surface. `@nuxt-photo/vue/extend` is public but lower-stability, and undocumented symbols should be treated as internal.
