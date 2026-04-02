---
title: Nuxt Image Integration
description: Use @nuxt/image for optimized thumbnails and lightbox slides.
navigation: true
---

# Nuxt Image Integration

nuxt-photo integrates with [`@nuxt/image`](https://image.nuxt.com) to serve optimized, responsive images. When detected, thumbnails and lightbox slides are automatically served through your configured image provider (Cloudinary, Imgix, Vercel, IPX, etc.).

## Setup

Install `@nuxt/image` and add it to your Nuxt modules **before** `@nuxt-photo/nuxt`:

```bash
pnpm add @nuxt/image
```

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt-photo/nuxt',
  ],
})
```

That's it. With the default `provider: 'auto'` setting, nuxt-photo detects `@nuxt/image` and uses it automatically.

## How It Works

nuxt-photo uses an **image adapter** system. The adapter is a function that receives a photo and a context, and returns the image source attributes (`src`, `srcset`, `sizes`).

When `@nuxt/image` is detected, the Nuxt module installs a plugin that provides a `nuxt-image` adapter via Vue's provide/inject. This adapter calls `@nuxt/image`'s `useImage()` composable to generate optimized URLs.

### Image Contexts

The adapter receives one of three contexts, which tell it what kind of image to produce:

| Context | Where | What it generates |
|---|---|---|
| `'thumb'` | Grid thumbnails | Smaller srcset for the album grid. Sizes based on container width and items per row. |
| `'slide'` | Lightbox slides | Full-viewport srcset for the lightbox view. |
| `'preload'` | Preloading | Reserved for future use. Currently treated the same as `'slide'`. |

Think of it this way: when you see a photo gallery, you see small thumbnails in a grid — those are `'thumb'` images and they don't need to be full resolution. When you click a photo and it opens full-screen in the lightbox, that's a `'slide'` image and it needs to be sharp at the full viewport size. The adapter knows which situation it's in, so it can request the right size from your image CDN — small and fast for the grid, large and crisp for the lightbox.

## Provider Configuration

```ts [nuxt.config.ts]
export default defineNuxtConfig({
  modules: [
    '@nuxt/image',
    '@nuxt-photo/nuxt',
  ],
  nuxtPhoto: {
    image: {
      // 'auto' — use @nuxt/image if installed, fall back to native <img>
      // 'nuxt-image' — require @nuxt/image (throws if not installed)
      // 'native' — always use plain <img> tags
      // 'custom' — you provide your own adapter via provide/inject
      provider: 'auto',
    },
  },
})
```

## Using Without @nuxt/image

When `@nuxt/image` is not installed (or `provider` is set to `'native'`), nuxt-photo uses plain `<img>` tags with the `src` and `srcset` from your `PhotoItem` data directly. You can provide your own `srcset` strings on each photo:

```ts
const photos = [
  {
    id: 1,
    src: '/photos/landscape.jpg',
    width: 1600,
    height: 900,
    srcset: '/photos/landscape-400.jpg 400w, /photos/landscape-800.jpg 800w, /photos/landscape-1600.jpg 1600w',
  },
]
```

## Custom Image Adapter

For full control, provide your own `ImageAdapter` function:

```ts
import type { ImageAdapter } from '@nuxt-photo/core'

const myAdapter: ImageAdapter = (photo, context) => {
  if (context === 'thumb') {
    return {
      src: `https://cdn.example.com/${photo.src}?w=400`,
      srcset: `https://cdn.example.com/${photo.src}?w=400 400w, https://cdn.example.com/${photo.src}?w=800 800w`,
      sizes: '(max-width: 600px) 50vw, 33vw',
    }
  }
  return {
    src: `https://cdn.example.com/${photo.src}?w=1600`,
  }
}
```

Pass it to `PhotoAlbum` or `Photo`:

```vue
<PhotoAlbum :photos="photos" :adapter="myAdapter" />
```

See the [Image Adapters guide](/docs/guides/image-adapters) for more details.
