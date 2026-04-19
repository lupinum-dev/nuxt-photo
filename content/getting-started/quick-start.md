---
title: Quick Start
description: Get a working photo gallery with lightbox in 5 minutes.
navigation: true
---

# Quick Start

This guide gets you from zero to a working gallery with lightbox in under 5 minutes. It assumes you've already [installed](/docs/getting-started/installation) `@nuxt-photo/nuxt`.

## 1. Define Your Photos

Create a photos array following the `PhotoItem` shape. Every photo needs an `id`, `src`, `width`, and `height`:

```ts
const photos = [
  {
    id: 1,
    src: '/photos/mountains.jpg',
    width: 1600,
    height: 900,
    alt: 'Mountain landscape',
  },
  {
    id: 2,
    src: '/photos/forest.jpg',
    width: 1200,
    height: 1600,
    alt: 'Forest path',
  },
  {
    id: 3,
    src: '/photos/lake.jpg',
    width: 1400,
    height: 1000,
    alt: 'Lake at sunset',
  },
  {
    id: 4,
    src: '/photos/city.jpg',
    width: 1800,
    height: 1200,
    alt: 'City skyline',
  },
  {
    id: 5,
    src: '/photos/beach.jpg',
    width: 1000,
    height: 1500,
    alt: 'Sandy beach',
  },
]
```

::callout{type="info"}
`width` and `height` are the **intrinsic dimensions** of the image. They're used to calculate aspect ratios for layout — the actual rendered size is computed by the layout algorithm.
::

## 2. Render a Gallery

Drop in `PhotoAlbum` with your photos:

```vue [pages/gallery.vue]
<script setup>
const photos = [
  {
    id: 1,
    src: '/photos/mountains.jpg',
    width: 1600,
    height: 900,
    alt: 'Mountain landscape',
  },
  {
    id: 2,
    src: '/photos/forest.jpg',
    width: 1200,
    height: 1600,
    alt: 'Forest path',
  },
  {
    id: 3,
    src: '/photos/lake.jpg',
    width: 1400,
    height: 1000,
    alt: 'Lake at sunset',
  },
  {
    id: 4,
    src: '/photos/city.jpg',
    width: 1800,
    height: 1200,
    alt: 'City skyline',
  },
  {
    id: 5,
    src: '/photos/beach.jpg',
    width: 1000,
    height: 1500,
    alt: 'Sandy beach',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" />
</template>
```

This renders a **rows** layout (the default) with an integrated lightbox. Click any photo to open the lightbox with keyboard navigation and swipe gestures.

## 3. Try Different Layouts

Switch the layout with a single prop:

```vue
<!-- Justified rows (default) -->
<PhotoAlbum :photos="photos" layout="rows" />

<!-- Equal-width columns -->
<PhotoAlbum :photos="photos" layout="columns" />

<!-- Masonry (Pinterest-style) -->
<PhotoAlbum :photos="photos" layout="masonry" />
```

## 4. Customize Layout Options

Pass an object for fine-grained control:

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'rows', targetRowHeight: 250 }"
  :spacing="12"
  :padding="4"
/>
```

Or make it responsive:

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
  :spacing="responsive({ 0: 4, 768: 8 })"
/>
```

The `responsive()` helper creates a function that picks the right value based on the album's container width. The keys are minimum widths in pixels — so `{ 0: 2, 768: 3, 1200: 4 }` means: 2 columns by default, 3 columns when the container is at least 768px wide, and 4 at 1200px+. See the [responsive guide](/docs/guides/responsive) for more.

::callout{type="info"}
`responsive()` is auto-imported in Nuxt. For plain Vue, import it from `@nuxt-photo/vue`:

```ts
import { responsive } from '@nuxt-photo/vue'
```

::

## 5. Add Captions

Include `caption` and `description` fields in your photo data:

```ts
const photos = [
  {
    id: 1,
    src: '/photos/mountains.jpg',
    width: 1600,
    height: 900,
    alt: 'Mountain landscape',
    caption: 'Swiss Alps',
    description: 'Taken during a summer hike near Zermatt.',
  },
]
```

Captions appear automatically in the lightbox.

## Next Steps

- [Layouts guide](/docs/guides/layouts) — deep dive into rows, columns, and masonry
- [Lightbox guide](/docs/guides/lightbox) — keyboard shortcuts, transitions, zoom
- [Responsive guide](/docs/guides/responsive) — container-width-aware configuration
- [PhotoAlbum API](/docs/components/photo-album) — full props and slots reference
