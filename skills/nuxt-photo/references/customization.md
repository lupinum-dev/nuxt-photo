# Customization

## Contents

- [Module Options](#module-options)
- [CSS Strategy](#css-strategy)
- [Image Providers](#image-providers)
- [Custom Image Adapter](#custom-image-adapter)
- [Signed URL Payloads](#signed-url-payloads)
- [Lightbox Customization](#lightbox-customization)
- [SSR and CLS](#ssr-and-cls)

## Module Options

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    autoImports: true,
    components: { prefix: '', primitives: false },
    css: 'structure',
    image: { provider: 'auto' },
  },
})
```

Use prefixes only to avoid collisions:

```ts
nuxtPhoto: {
  components: { prefix: 'Np' }, // <NpPhotoAlbum>
  autoImports: { prefix: 'Np' }, // useNpLightbox, useNpLightboxProvider, npResponsive
}
```

Enable primitive component auto-registration only when composing custom lightbox templates in Nuxt SFCs:

```ts
nuxtPhoto: {
  components: { primitives: true },
}
```

## CSS Strategy

```ts
nuxtPhoto: {
  css: 'structure', // 'none' | 'structure' | 'all'
}
```

- `structure`: default; layout and geometry CSS only.
- `all`: structure plus default visual theme.
- `none`: no Nuxt Photo CSS; only use with a complete replacement.

Prefer class props (`itemClass`, `imgClass`, `slideClass`, `controlsClass`) and CSS variables before replacing markup.

Use `:deep()` for scoped Vue styles that target `.np-*` classes:

```vue
<style scoped>
.gallery :deep(.np-album__item) {
  border-radius: 8px;
}
</style>
```

## Image Providers

Default behavior:

```ts
nuxtPhoto: {
  image: { provider: 'auto' },
}
```

Provider modes:

- `auto`: use `@nuxt/image` if it is in `modules`, otherwise use native `<img>`.
- `nuxt-image`: require `@nuxt/image` and fail if it is not installed.
- `native`: pass `src`, `thumbSrc`, and `srcset` through to browser images.
- `false`: skip module adapter registration; provide `ImageAdapterKey` yourself or pass `imageAdapter` props.

For already-signed CDN URLs, prefer `native` and carry the signed URLs on `PhotoItem`.
Do not route signed URLs through `@nuxt/image` unless that provider owns signing deterministically.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    image: { provider: 'native' },
  },
})
```

Recommended `@nuxt/image` setup:

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt'],
  image: {
    provider: 'cloudinary',
    cloudinary: {
      baseURL: 'https://res.cloudinary.com/your-cloud/image/upload/',
    },
  },
  nuxtPhoto: {
    image: {
      provider: 'nuxt-image',
      thumb: {
        sizes: 'sm:100vw md:50vw lg:400px',
        quality: 80,
      },
      slide: {
        widths: [640, 960, 1240, 1600, 2000],
        maxWidth: 1240,
        maxDensity: 1.5,
        sizes: 'min(1240px, calc(100vw - 72px))',
        quality: 85,
      },
    },
  },
})
```

## Custom Image Adapter

Use a custom adapter only when module providers cannot express deterministic render-time transforms,
such as bespoke CMS resize URLs or selecting from precomputed CDN variants.
For signed URLs, prefer [signed URL payloads](#signed-url-payloads) instead of signing in the adapter.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    image: false,
  },
})
```

```ts
// app/utils/photoAdapter.ts
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/nuxt/app'

const BASE = 'https://cdn.example.com/transform'

function url(photo: PhotoItem, width: number, format = 'webp') {
  return `${BASE}/${photo.id}?w=${width}&fmt=${format}`
}

export const cmsAdapter: ImageAdapter = (photo, context) => {
  if (context === 'thumb') {
    return {
      src: url(photo, 480),
      srcset: `${url(photo, 480)} 480w, ${url(photo, 960)} 960w`,
      width: photo.width,
      height: photo.height,
    }
  }

  return {
    src: url(photo, 1920),
    srcset: [640, 960, 1440, 1920, 2560]
      .map((width) => `${url(photo, width)} ${width}w`)
      .join(', '),
    sizes: '100vw',
    width: photo.width,
    height: photo.height,
  }
}
```

Provide globally from a normal Nuxt plugin, not a client-only plugin:

```ts
// app/plugins/photo-adapter.ts
import { ImageAdapterKey } from '@nuxt-photo/vue'
import { cmsAdapter } from '~/utils/photoAdapter'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(ImageAdapterKey, cmsAdapter)
})
```

Because `ImageAdapterKey` comes from `@nuxt-photo/vue`, add `@nuxt-photo/vue` as a direct app dependency when importing it.

Per-instance override:

```vue
<PhotoAlbum :photos="cmsPhotos" :image-adapter="cmsAdapter" />
```

## Signed URL Payloads

Do not call `Date.now()` or sign inside an adapter during SSR.
Generate signed URLs before render and place them on `photo.src` / `photo.thumbSrc`.

Use Nuxt payload hydration for server-generated signed URLs:

```vue
<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/nuxt/app'

type CdnPhoto = {
  id: string
  width: number
  height: number
  alt?: string
  signed: { full: string; thumb: string; srcset?: string }
}

const { data } = await useAsyncData('gallery', async () => {
  const items = await $fetch<CdnPhoto[]>('/api/photos')

  return items.map(
    (photo): PhotoItem => ({
      id: photo.id,
      src: photo.signed.full,
      thumbSrc: photo.signed.thumb,
      srcset: photo.signed.srcset,
      width: photo.width,
      height: photo.height,
      alt: photo.alt,
    }),
  )
})
</script>

<template>
  <PhotoAlbum :photos="data ?? []" layout="rows" />
</template>
```

## Lightbox Customization

Choose the shallowest surface:

1. Use recipe slots when the default lightbox structure is right but captions/actions/slides need custom markup.
2. Pass `:lightbox="MyLightbox"` to one `<Photo>`, `<PhotoAlbum>`, `<PhotoGroup>`, or `<PhotoCarousel>` when one instance needs different chrome.
3. Provide `LightboxComponentKey` once for a global recipe lightbox override.
4. Build with primitives only when the overlay layout itself must change.

Global recipe override:

```ts
// app/plugins/nuxt-photo-lightbox.ts
import { LightboxComponentKey } from '@nuxt-photo/vue'
import MyLightbox from '~/components/MyLightbox.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(LightboxComponentKey, MyLightbox)
})
```

Recipe override rule: a component passed through `:lightbox` or `LightboxComponentKey` must consume the existing context and must not call `useLightboxProvider()`.

Standalone custom gallery rule: if the component owns both the thumbnail layout and lightbox, call `useLightboxProvider()` once near the top and render descendants inside that provider context.

Primitive order:

```txt
useLightboxProvider or <LightboxProvider>
  LightboxRoot
    LightboxOverlay
    LightboxViewport
      LightboxSlide
    LightboxControls
    LightboxCaption
```

## SSR and CLS

Always start with real `width` and `height`. Then tune:

```vue
<PhotoAlbum
  :photos="photos"
  layout="rows"
  :default-container-width="1280"
  :breakpoints="[375, 640, 1024, 1280]"
/>
```

- `defaultContainerWidth` lets the server compute a deterministic layout.
- `breakpoints` snap client measurement to a known set after mount.
- `responsive()` automatically contributes its breakpoint keys.
- Columns and masonry need `defaultContainerWidth` more than rows because they do not have the same rows fallback.

Responsive example:

```vue
<template>
  <PhotoAlbum
    :photos="photos"
    :default-container-width="1280"
    :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
    :layout="{
      type: 'columns',
      columns: responsive({ 0: 2, 768: 3, 1200: 4 }),
    }"
  />
</template>
```
