# @nuxt-photo/recipes

Ready-to-use Vue components for Nuxt Photo.

Use this package when you want working components like `<PhotoAlbum>` and `<PhotoCarousel>` without assembling primitives yourself.

## Install

In a plain Vue app:

```bash
pnpm add @nuxt-photo/recipes
```

This package depends on the Vue and core layers for you. In a Nuxt app, install `@nuxt-photo/nuxt` instead.

## Styles

In a plain Vue app, import the structure CSS for the components you use. For a `PhotoAlbum` with the built-in lightbox:

```ts
import '@nuxt-photo/recipes/styles/album.css'
import '@nuxt-photo/recipes/styles/photo-structure.css'
import '@nuxt-photo/recipes/styles/lightbox-structure.css'
```

Add the theme files too if you want the default visual styling instead of only the required layout/geometry CSS.

## Example

```vue
<script setup lang="ts">
import { PhotoAlbum, type PhotoItem } from '@nuxt-photo/recipes'

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

- `<Lightbox>`
- `<Photo>`
- `<PhotoAlbum>`
- `<PhotoGroup>`
- `<PhotoCarousel>`

## Where next

- [Root documentation](../../README.md)
- [Vue package guide](../vue/README.md)
