---
title: Image Adapters
description: Control how images are resolved for thumbnails, slides, and preloading.
navigation: true
---

# Image Adapters

An image adapter is a function that transforms a `PhotoItem` into the final image source attributes (`src`, `srcset`, `sizes`). nuxt-photo uses adapters to decouple photo data from image delivery — you can swap between a CDN, `@nuxt/image`, or custom logic without changing your components.

## The ImageAdapter Type

```ts
type ImageAdapter = (photo: PhotoItem, context: ImageContext) => ImageSource

type ImageContext = 'thumb' | 'slide' | 'preload'

type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}
```

The adapter receives:

- **photo** — the photo data
- **context** — where the image will be displayed:
  - `'thumb'` — grid thumbnail (small, responsive)
  - `'slide'` — lightbox slide (full viewport)
  - `'preload'` — future preloading support (treated as `'slide'` by the native adapter)

## Native Adapter (Default)

When no custom adapter is configured, nuxt-photo uses the native adapter. It returns the photo's `src` and `srcset` directly:

```ts
// What the native adapter does (simplified)
function nativeAdapter(photo: PhotoItem, context: ImageContext): ImageSource {
  return {
    src: context === 'thumb' && photo.thumbSrc ? photo.thumbSrc : photo.src,
    srcset: photo.srcset,
  }
}
```

## Custom Adapter

Pass an image adapter to `PhotoAlbum` or `Photo`:

```vue
<script setup>
import type { ImageAdapter } from '@nuxt-photo/core'

const cloudinaryAdapter: ImageAdapter = (photo, context) => {
  const baseUrl = `https://res.cloudinary.com/demo/image/upload`

  if (context === 'thumb') {
    return {
      src: `${baseUrl}/w_400/${photo.src}`,
      srcset: [400, 800].map(w => `${baseUrl}/w_${w}/${photo.src} ${w}w`).join(', '),
      sizes: '(max-width: 600px) 50vw, 33vw',
    }
  }

  return {
    src: `${baseUrl}/w_1600/${photo.src}`,
    srcset: [800, 1200, 1600, 2400].map(w => `${baseUrl}/w_${w}/${photo.src} ${w}w`).join(', '),
    sizes: '100vw',
  }
}
</script>

<template>
  <PhotoAlbum :photos="photos" :image-adapter="cloudinaryAdapter" />
</template>
```

## PhotoAdapter (Data Transformation)

A `PhotoAdapter` is different from an `ImageAdapter`. It transforms **external data shapes** into `PhotoItem` objects. Use it when your API or CMS returns data that doesn't match the `PhotoItem` type:

```ts
type PhotoAdapter<T = any> = (item: T) => PhotoItem
```

### Example: Unsplash API

```vue
<script setup>
import type { PhotoAdapter } from '@nuxt-photo/core'

interface UnsplashPhoto {
  id: string
  urls: { regular: string; thumb: string }
  width: number
  height: number
  alt_description: string | null
}

const fromUnsplash: PhotoAdapter<UnsplashPhoto> = (item) => ({
  id: item.id,
  src: item.urls.regular,
  thumbSrc: item.urls.thumb,
  width: item.width,
  height: item.height,
  alt: item.alt_description ?? undefined,
})
</script>

<template>
  <PhotoAlbum :photos="unsplashPhotos" :photo-adapter="fromUnsplash" />
</template>
```

### Example: WordPress Media API

```ts
const fromWordPress: PhotoAdapter = (item) => ({
  id: item.id,
  src: item.source_url,
  thumbSrc: item.media_details.sizes?.medium?.source_url,
  width: item.media_details.width,
  height: item.media_details.height,
  alt: item.alt_text,
  caption: item.caption?.rendered,
})
```

## Adapter vs PhotoAdapter

|               | `ImageAdapter`                                | `PhotoAdapter`                       |
| ------------- | --------------------------------------------- | ------------------------------------ |
| **Purpose**   | Controls how images are served (URLs, srcset) | Transforms API data into `PhotoItem` |
| **Input**     | `PhotoItem` + context                         | Your custom data type                |
| **Output**    | `ImageSource` (src, srcset, sizes)            | `PhotoItem`                          |
| **Prop name** | `imageAdapter`                                | `itemAdapter`                        |
| **Used by**   | `PhotoAlbum`, `Photo`, `PhotoImage`           | `PhotoAlbum`, `PhotoGroup`           |

## Providing an Adapter Globally

Use Vue's provide/inject to set a default adapter for all components:

```vue [app.vue]
<script setup>
import { ImageAdapterKey } from '@nuxt-photo/vue'

provide(ImageAdapterKey, myAdapter)
</script>
```

When `@nuxt/image` is installed with the Nuxt module, this is done automatically via a plugin.
