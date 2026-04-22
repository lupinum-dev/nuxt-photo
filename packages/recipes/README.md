# @nuxt-photo/recipes

Ready-to-use Vue components for Nuxt Photo.

Use this package when you want working components like `<PhotoAlbum>` and `<PhotoCarousel>` without assembling primitives yourself.

## Install

In a plain Vue app:

```bash
pnpm add @nuxt-photo/recipes
```

This package depends on the Vue and core layers for you. In a Nuxt app, install `@nuxt-photo/nuxt` instead.

## Example

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/core'

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

## Components

- `<Photo>`
- `<PhotoAlbum>`
- `<PhotoGroup>`
- `<PhotoCarousel>`

## Where next

- [Root documentation](../../README.md)
- [Vue package guide](../vue/README.md)
