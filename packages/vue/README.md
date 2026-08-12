# @nuxt-photo/vue

Responsive photo albums, carousels, and lightboxes for Vue. This is the complete
Vue library behind the Nuxt module: use its recipe components for normal
galleries, then move to composables and primitives when the design needs custom
viewer markup.

## Install

```bash
pnpm add @nuxt-photo/vue
```

## Render an album

```vue
<script setup lang="ts">
import { PhotoAlbum, type PhotoItem } from '@nuxt-photo/vue'
import '@nuxt-photo/vue/styles.css'

const photos: PhotoItem[] = [
  {
    id: 'desert',
    src: '/photos/desert.jpg',
    width: 1280,
    height: 800,
    alt: 'Dunes at sunset',
  },
  {
    id: 'ocean',
    src: '/photos/ocean.jpg',
    width: 960,
    height: 1200,
    alt: 'Rocky coast from above',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" layout="rows" />
</template>
```

Selecting a thumbnail opens the built-in lightbox. Intrinsic `width` and
`height` values let the album reserve space before each image loads.

## Public surface

The root entrypoint also exports:

- composables like `useLightbox`, `useLightboxProvider`, `useContainerWidth`, and `responsive`
- lightbox building blocks like `LightboxProvider`, `LightboxRoot`, `LightboxOverlay`, `LightboxViewport`, `PhotoTrigger`, and `PhotoImage`
- documented injection keys like `LightboxComponentKey`, `ImageAdapterKey`, and `LightboxDefaultsKey`

`useLightboxProvider()` is the advanced entrypoint for custom lightbox
components. Prefer `PhotoAlbum`, `PhotoGroup`, and `PhotoCarousel` until the
viewer needs different markup rather than different styling.

## Stability

Use the root `@nuxt-photo/vue` entrypoint for both normal usage and advanced customization.

Undocumented exports and generated deep paths are internal.

The [component reference](https://nuxt-photo.lupinum.com/docs/components/lightbox-primitives)
shows the required primitive nesting. The [composables reference](https://nuxt-photo.lupinum.com/docs/reference/composables)
documents provider context, controller state, and failure behavior.
