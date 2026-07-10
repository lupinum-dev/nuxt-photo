# Gallery Basics

## Contents

- [Install](#install)
- [First Styled Result](#first-styled-result)
- [PhotoItem Contract](#photoitem-contract)
- [Components](#components)
- [PhotoAlbum](#photoalbum)
- [PhotoGroup](#photogroup)
- [PhotoCarousel](#photocarousel)

## Install

Prerequisites:

- Nuxt 4.x
- Node 22.12+, 24.11+, or 26+

Preferred install:

```bash
npx nuxi module add @nuxt-photo/nuxt
```

Manual install: run exactly one command for the app's package manager:

```bash
# pnpm
pnpm add @nuxt-photo/nuxt

# npm
npm install @nuxt-photo/nuxt

# yarn
yarn add @nuxt-photo/nuxt

# bun
bun add @nuxt-photo/nuxt
```

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
})
```

Install `@nuxt-photo/vue` directly only when a plain Vue app imports that
package. Nuxt apps use `@nuxt-photo/nuxt` and its `/app` facade.

## First Styled Result

Use `css: 'all'` for a polished first pass. The default `structure` mode is correct but intentionally unthemed.

```ts
export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt'],
  nuxtPhoto: {
    css: 'all',
  },
})
```

## PhotoItem Contract

Every rendered photo must have:

```ts
import type { PhotoItem } from '@nuxt-photo/nuxt/app'

const photos: PhotoItem[] = [
  {
    id: 'desert-01',
    src: '/photos/desert.jpg',
    width: 1280,
    height: 800,
    alt: 'Desert at golden hour',
    caption: 'Desert Light',
  },
]
```

Rules:

- `id` must be stable and unique within the rendered list.
- `src` is the full-size image used by the lightbox.
- `width` and `height` are intrinsic image pixels, not CSS display size.
- `thumbSrc` is useful for native/pre-optimized thumbnail URLs.
- `srcset` is an escape hatch for native image loading when the app builds `srcset` itself.
- `meta` is app-owned data and remains available in slots and adapters.

Map external data into the public model at the application boundary:

```ts
type Asset = {
  sys: { id: string }
  fields: {
    title?: string
    file: { url: string; details: { image: { width: number; height: number } } }
  }
}

const photos = assets.map(
  (item): PhotoItem => ({
    id: item.sys.id,
    src: item.fields.file.url,
    width: item.fields.file.details.image.width,
    height: item.fields.file.details.image.height,
    alt: item.fields.title,
  }),
)
```

## Components

Use the highest-level component that fits:

| Component         | Use for                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `<Photo>`         | One standalone image with optional lightbox.                                  |
| `<PhotoAlbum>`    | Rows, columns, or masonry grid with built-in lightbox.                        |
| `<PhotoGroup>`    | Multiple photos/albums sharing one lightbox, or custom thumbnail layouts.     |
| `<PhotoCarousel>` | Horizontal Embla-powered carousel with optional thumbnails/autoplay/lightbox. |

Recipe components are auto-registered by the Nuxt module. Composables `useLightbox`, `useLightboxProvider`, and `responsive` are auto-imported unless `autoImports` is disabled.

## PhotoAlbum

```vue
<template>
  <PhotoAlbum
    :photos="photos"
    :layout="{ type: 'rows', targetRowHeight: 240 }"
    :spacing="8"
  />
</template>
```

Layouts:

- `layout="rows"` for justified rows; best for mixed aspect ratios.
- `:layout="{ type: 'columns', columns: 3 }"` for fixed columns.
- `:layout="{ type: 'masonry', columns: 4 }"` for shortest-column flow.

Responsive values can use the auto-imported `responsive()` helper:

```vue
<template>
  <PhotoAlbum
    :photos="photos"
    :layout="{
      type: 'columns',
      columns: responsive({ 0: 2, 640: 3, 1024: 4 }),
    }"
    :spacing="responsive({ 0: 4, 640: 8, 1024: 12 })"
  />
</template>
```

If the app disables Nuxt Photo auto-imports and imports `responsive` explicitly from `@nuxt-photo/vue`, add `@nuxt-photo/vue` as a direct dependency.

## PhotoGroup

PhotoGroup collects descendant recipes into one shared lightbox:

```vue
<PhotoGroup>
  <PhotoAlbum :photos="landscapes" :layout="{ type: 'rows' }" />
  <PhotoAlbum :photos="portraits" :layout="{ type: 'columns' }" />
</PhotoGroup>
```

Custom layouts use the explicit headless primitives:

```vue
<LightboxProvider :photos="photos">
  <div class="grid">
    <PhotoTrigger
      v-for="(photo, index) in photos"
      :key="photo.id"
      :photo="photo"
      :index="index"
    >
      <img :src="photo.thumbSrc ?? photo.src" :alt="photo.alt" />
    </PhotoTrigger>
  </div>
  <Lightbox />
</LightboxProvider>
```

PhotoGroup exposes `open`, `openById`, and `close` through a template ref. Inside
a `LightboxProvider`, descendants use `useLightbox()`.

If the custom layout should still use the configured image adapter, render `<PhotoImage>` instead of a raw `<img>`.

## PhotoCarousel

```vue
<PhotoCarousel
  :photos="photos"
  :options="{ loop: true }"
  show-arrows
  show-thumbnails
  show-counter
  slide-aspect="16/9"
  :lightbox="true"
/>
```

Defaults: arrows, thumbnails, and counter render by default; dots and autoplay are off by default. `lightbox` is off by default for carousels, so pass `:lightbox="true"` when tapping a slide should open the viewer.

Autoplay can be a boolean or options object:

```vue
<PhotoCarousel :photos="photos" :autoplay="{ delayMs: 4000 }" />
```

Carousel options are library-owned. Embla plugin objects are intentionally not
part of the public component API.
