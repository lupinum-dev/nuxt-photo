# nuxt-photo

`nuxt-photo` is a Nuxt-first photo module with three clean surface areas:

- lean image rendering
- lean album layout rendering
- opt-in lightbox ownership

The module now treats bundle boundaries as API boundaries. `PhotoImg` and `PhotoAlbum` no longer hide a lightbox runtime inside themselves.

## Install

```bash
npx nuxt module add nuxt-photo
```

```ts
export default defineNuxtConfig({
  modules: ['nuxt-photo'],
})
```

`@nuxt/image` is optional. When present, `PhotoImage` renders through `NuxtImg`. Otherwise it falls back to a native `<img>`.

## Public Surface

### Base surfaces

- `PhotoImg`: single image renderer with caption handling and optional interactive trigger styling
- `PhotoAlbum`: layout renderer for `rows`, `columns`, and `masonry`
- `PhotoGallery`: custom thumbnail surface backed by `PhotoLightbox`
- `PhotoLightbox`: headless lightbox runtime surface

### Convenience lightbox wrappers

- `PhotoLightboxImg`: `PhotoImg` + `PhotoLightbox`
- `PhotoLightboxAlbum`: `PhotoAlbum` + `PhotoLightbox`

## Bundle-first imports

Use the feature subpaths when bundle shape matters outside Nuxt auto-imports:

```ts
import { PhotoImg, PhotoLightboxImg } from 'nuxt-photo/img'
import { PhotoAlbum, PhotoLightboxAlbum } from 'nuxt-photo/album'
import { PhotoGallery, PhotoLightbox } from 'nuxt-photo/lightbox'
```

The package root still exports the full convenience surface.

## Quick Start

### Lean standalone image

```vue
<PhotoImg
  src="/photos/hero.jpg"
  alt="Hero image"
  caption="Hero"
  :width="1600"
  :height="1200"
  caption-visible="below"
/>
```

### Standalone image with lightbox

```vue
<PhotoLightboxImg
  src="/photos/hero.jpg"
  thumbnail-src="/photos/hero-thumb.jpg"
  alt="Hero image"
  caption="Hero"
  description="Shown below and in the overlay."
  :width="1600"
  :height="1200"
  caption-visible="both"
/>
```

### Lean album layout

```vue
<PhotoAlbum
  :items="items"
  layout="masonry"
  :columns="{ 0: 2, 768: 3 }"
  :spacing="{ 0: 8, 768: 12 }"
  :padding="0"
/>
```

### Album with controlled lightbox

```vue
<script setup lang="ts">
const lightboxIndex = ref<number | null>(null)
</script>

<template>
  <PhotoLightboxAlbum
    v-model:lightbox-index="lightboxIndex"
    :items="items"
    layout="masonry"
    :columns="{ 0: 2, 768: 3 }"
    :spacing="{ 0: 8, 768: 12 }"
    :padding="0"
  />
</template>
```

## Choosing the right component

Use `PhotoImg` when the job is rendering one image.

Use `PhotoLightboxImg` when that same image should own a local or grouped overlay.

Use `PhotoAlbum` when layout is the product.

Use `PhotoLightboxAlbum` when the album itself should own lightbox state and `v-model:lightbox-index`.

Use `PhotoGallery` when thumbnail markup is fully custom.

Use `PhotoLightbox` when the overlay is the primary surface and you want programmatic control.

## Core behavior

### `PhotoImg`

- Handles caption placement with `caption-visible`
- Defaults to passive rendering
- Becomes a button trigger when `interactive` is `true`
- Emits `click` when interactive

### `PhotoLightboxImg`

- Accepts the old lightbox-oriented concerns:
  - `lightbox`
  - `group`
  - `controls` slot
- Owns the actual lightbox instance

### `PhotoAlbum`

- Handles layout only
- Emits `click` with item/index/layout payload
- `#photo` slot now exposes layout/render data only

### `PhotoLightboxAlbum`

- Accepts album layout props plus:
  - `lightbox`
  - `lightbox-index`
- Emits:
  - `click`
  - `update:lightbox-index`
  - `lightbox-open`
  - `lightbox-close`
- `#photo` slot exposes `open` and `selected` because those are wrapper concerns, not base album concerns

## Data model

```ts
interface PhotoItem {
  key?: string | number
  src: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  thumbnailSrc?: string
  href?: string
}
```

## Headless composition

`PhotoGallery` and `PhotoLightbox` remain the lower-level APIs for custom thumbnail and overlay flows.

```vue
<PhotoGallery :items="items">
  <template #thumbnail="{ item, open, bindThumbnail }">
    <button :ref="bindThumbnail" type="button" @click="open">
      <img :src="'src' in item ? String(item.msrc || item.src) : ''">
    </button>
  </template>
</PhotoGallery>
```

## Migration notes

This release is intentionally breaking.

### Removed from `PhotoImg`

- internal lightbox ownership
- `lightbox`
- `group`
- `controls` slot

If you need overlay behavior, move to `PhotoLightboxImg`.

### Removed from `PhotoAlbum`

- internal lightbox ownership
- `lightbox`
- `lightboxIndex`
- `update:lightbox-index`
- `lightbox-open`
- `lightbox-close`
- lightbox-aware `#photo` slot fields such as `open` and `selected`

If you need overlay behavior, move to `PhotoLightboxAlbum`.

## Exports

Package root exports:

- `PhotoImage`
- `PhotoImg`
- `PhotoAlbum`
- `PhotoLightboxImg`
- `PhotoLightboxAlbum`
- `PhotoGallery`
- `PhotoLightbox`
- `usePhotoLightbox`
- `usePhotoAlbumLayout`
- `usePhotoGroup`
- `useContainerWidth`

## Local development

```bash
npm run test
npm run test:types
npx tsx scripts/benchmark-bundle.ts
```
