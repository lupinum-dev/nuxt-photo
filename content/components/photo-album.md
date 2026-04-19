---
title: PhotoAlbum
description: A photo grid with three layout algorithms and an integrated lightbox.
navigation: true
---

# PhotoAlbum

The `PhotoAlbum` component renders a collection of photos in a grid using one of three layout algorithms — rows, columns, or masonry. It includes an integrated lightbox by default.

## Usage

### Basic

```vue
<script setup>
const photos = [
  { id: 1, src: '/photos/a.jpg', width: 1600, height: 900 },
  { id: 2, src: '/photos/b.jpg', width: 900, height: 1200 },
  { id: 3, src: '/photos/c.jpg', width: 1000, height: 1000 },
]
</script>

<template>
  <PhotoAlbum :photos="photos" />
</template>
```

### With layout options

```vue
<!-- String shorthand -->
<PhotoAlbum :photos="photos" layout="masonry" />

<!-- Object form with options -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'rows', targetRowHeight: 250 }"
  :spacing="12"
/>

<!-- Responsive columns -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
  :spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
/>
```

### Inside a PhotoGroup

When placed inside a [`PhotoGroup`](/docs/components/photo-group), the album's photos join the group's shared lightbox:

```vue
<PhotoGroup>
  <PhotoAlbum :photos="landscapes" layout="rows" />
  <PhotoAlbum :photos="portraits" layout="columns" />
</PhotoGroup>
```

### With custom thumbnails

```vue
<PhotoAlbum :photos="photos">
  <template #thumbnail="{ photo, index, width, height, hidden }">
    <div :style="{ opacity: hidden ? 0 : 1 }">
      <img :src="photo.thumbSrc || photo.src" :alt="photo.alt" />
      <span class="badge">{{ index + 1 }}</span>
    </div>
  </template>
</PhotoAlbum>
```

### With CMS data

```vue
<script setup>
import type { PhotoAdapter } from '@nuxt-photo/core'

const cmsPhotos = await fetchFromCMS()

const adapter: PhotoAdapter = (item) => ({
  id: item.uuid,
  src: item.file.url,
  width: item.file.width,
  height: item.file.height,
  alt: item.title,
  caption: item.title,
  description: item.description,
})
</script>

<template>
  <PhotoAlbum :photos="cmsPhotos" :photo-adapter="adapter" />
</template>
```

## Props

| Prop                    | Type                                                                  | Default     | Description                                                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photos`                | `PhotoItem[] \| any[]`                                                | —           | **Required.** Array of photos. When using `itemAdapter`, items can be any shape.                                                                                |
| `itemAdapter`           | `PhotoAdapter`                                                        | `undefined` | Transforms each item in `photos` into a `PhotoItem`. Use when feeding CMS or API data directly.                                                                 |
| `layout`                | `AlbumLayout \| AlbumLayout['type']`                                  | `'rows'`    | Layout algorithm. Pass a string (`'rows'`, `'columns'`, or `'masonry'`) for defaults, or an object for full control.                                            |
| `spacing`               | `ResponsiveParameter<number>`                                         | `8`         | Gap between images in pixels. Accepts a static number or a responsive function.                                                                                 |
| `padding`               | `ResponsiveParameter<number>`                                         | `0`         | Outer padding around each image in pixels. Accepts a static number or a responsive function.                                                                    |
| `defaultContainerWidth` | `number`                                                              | `undefined` | Assumed container width for SSR. When set, the JS layout runs server-side so the rendered HTML matches hydration — eliminating CLS. Combine with `breakpoints`. |
| `breakpoints`           | `readonly number[]`                                                   | `undefined` | Snaps the observed container width to the largest breakpoint ≤ actual width. Prevents re-layout on sub-pixel fluctuations and scrollbar oscillation.            |
| `sizes`                 | `{ size: string; sizes?: Array<{ viewport: string; size: string }> }` | `undefined` | `<img sizes>` hint for responsive images in the rows layout. `size` describes the container width (e.g., `'100vw'`).                                            |
| `imageAdapter`          | `ImageAdapter`                                                        | `undefined` | Custom image adapter for generating `src`, `srcset`, and `sizes` attributes.                                                                                    |
| `lightbox`              | `boolean \| Component`                                                | `true`      | Whether to enable the lightbox. Pass `false` to disable, `true` for default, or a custom component.                                                             |
| `transition`            | `LightboxTransitionOption`                                            | `undefined` | Transition mode for lightbox open/close. See [Transitions guide](/docs/guides/transitions).                                                                     |
| `itemClass`             | `string`                                                              | `undefined` | Extra CSS classes for each album item wrapper `<div>`.                                                                                                          |
| `imgClass`              | `string`                                                              | `undefined` | Extra CSS classes for each album `<img>` element.                                                                                                               |

## Layout Options

The `layout` prop accepts a string shorthand or an object. Each layout type has its own options:

### Rows

```vue
<PhotoAlbum :photos="photos" :layout="{ type: 'rows', targetRowHeight: 280 }" />
```

| Option            | Type                          | Default | Description                                                                                                                |
| ----------------- | ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `targetRowHeight` | `ResponsiveParameter<number>` | `300`   | Ideal row height in pixels. The algorithm adjusts photo widths to fill each row while keeping heights close to this value. |

### Columns

```vue
<PhotoAlbum :photos="photos" :layout="{ type: 'columns', columns: 3 }" />
```

| Option    | Type                          | Default | Description        |
| --------- | ----------------------------- | ------- | ------------------ |
| `columns` | `ResponsiveParameter<number>` | `3`     | Number of columns. |

### Masonry

```vue
<PhotoAlbum :photos="photos" :layout="{ type: 'masonry', columns: 3 }" />
```

| Option    | Type                          | Default | Description                                                  |
| --------- | ----------------------------- | ------- | ------------------------------------------------------------ |
| `columns` | `ResponsiveParameter<number>` | `3`     | Number of columns. Photos are placed in the shortest column. |

## Slots

| Slot        | Props                                                                                 | Description                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `thumbnail` | `{ photo: PhotoItem, index: number, width: number, height: number, hidden: boolean }` | Custom thumbnail content. Replaces the default `<img>`. `hidden` is `true` during lightbox FLIP transitions. |
| `toolbar`   | `{ activeIndex: number, activePhoto: PhotoItem, count: number }`                      | Custom lightbox toolbar. Forwarded to the lightbox component.                                                |
| `caption`   | `{ photo: PhotoItem, activeIndex: number }`                                           | Custom lightbox caption. Forwarded to the lightbox component.                                                |
| `slide`     | `{ photo: PhotoItem, index: number, width: number, height: number }`                  | Custom lightbox slide content. Forwarded to the lightbox component.                                          |

## CSS Classes

| Class                | Element                             |
| -------------------- | ----------------------------------- |
| `.np-album`          | Root container                      |
| `.np-album--rows`    | Root when layout is rows            |
| `.np-album--columns` | Root when layout is columns         |
| `.np-album--masonry` | Root when layout is masonry         |
| `.np-album__item`    | Individual photo wrapper            |
| `.np-album__img`     | Photo `<img>` element               |
| `.np-album__row`     | Row group wrapper (columns/masonry) |
| `.np-album__column`  | Column group wrapper                |
