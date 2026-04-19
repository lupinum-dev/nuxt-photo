# @nuxt-photo/recipes

Ready-to-use Nuxt Photo components:

- `<Photo>`
- `<PhotoAlbum>`
- `<PhotoGroup>`
- `<PhotoCarousel>`

Install through `@nuxt-photo/nuxt` for the default Nuxt experience, or consume this package directly in a Vue app alongside `@nuxt-photo/vue`.

## Install

```bash
pnpm add @nuxt-photo/recipes @nuxt-photo/vue @nuxt-photo/core
```

## Example

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
