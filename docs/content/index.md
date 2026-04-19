---
title: "Photo galleries for Nuxt."
navigation: false
description: "Justified albums, a shared lightbox with pinch-to-zoom, an Embla-powered carousel, and headless primitives — auto-imported into any Nuxt 3 or 4 app."
seo:
  ogImage: '/social-card.png'
---

::u-page-hero
---
orientation: 'horizontal'
ui:
  container: 'lg:items-start'
---
#headline
  :::u-button
  ---
  size: sm
  to: /docs/getting-started/introduction
  variant: outline
  trailing-icon: i-lucide-arrow-right
  ---
  Albums, lightbox, carousel, primitives — for Nuxt
  :::

#title
Photo galleries for Nuxt, [done right]{.text-primary}.

#description
Nuxt Photo drops in a single module and gives you justified row layouts, shared lightbox with pinch-to-zoom, and an Embla carousel — all SSR-safe and wired to `@nuxt/image` when you need it.

#links
  :::u-button
  ---
  size: lg
  to: /docs/getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :u-input-copy{value="npx nuxi module add @nuxt-photo/nuxt"}

#default
::tabs{class="xl:-mt-10"}
  :::tabs-item{label="Album" icon="i-lucide-grid-3x3"}
  ```vue
  <script setup lang="ts">
  import type { PhotoItem } from '@nuxt-photo/core'

  const photos: PhotoItem[] = [
    { id: '1', src: '/photos/desert.jpg', width: 1280, height: 800, alt: 'Desert' },
    { id: '2', src: '/photos/ocean.jpg', width: 960, height: 1200, alt: 'Ocean' }
  ]
  </script>

  <template>
    <PhotoAlbum :photos="photos" layout="rows" :target-row-height="240" />
  </template>
  ```
  :::
  :::tabs-item{label="Photo" icon="i-lucide-image"}
  ```vue
  <template>
    <Photo
      :photo="{
        id: 'hero',
        src: '/photos/hero.jpg',
        width: 1600,
        height: 1000,
        alt: 'Hero image'
      }"
      lightbox
    />
  </template>
  ```
  :::
  :::tabs-item{label="Group" icon="i-lucide-layers"}
  ```vue
  <template>
    <!-- One lightbox, shared across both albums -->
    <PhotoGroup>
      <PhotoAlbum :photos="landscape" layout="rows" />
      <PhotoAlbum :photos="studies" layout="rows" />
    </PhotoGroup>
  </template>
  ```
  :::
  :::tabs-item{label="Carousel" icon="i-lucide-images"}
  ```vue
  <template>
    <PhotoCarousel
      :photos="photos"
      :options="{ loop: true }"
      show-thumbnails
      :lightbox="true"
    />
  </template>
  ```
  :::
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
Justified rows, in one line

#description
Drop `<PhotoAlbum>` with a photo array. The layout algorithm keeps rows visually balanced across every breakpoint, the lightbox opens with a FLIP transition, and zoom-and-pan work on touch.

#default
::demo-album-rows
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
One lightbox, many albums

#description
Wrap any number of `<PhotoAlbum>` in a `<PhotoGroup>` and they share a single lightbox. Click a photo in either album below — navigation flows across both.

#default
::demo-group
::
::

::u-page-section
---
ui:
  container: pt-0
  title: text-3xl font-semibold
---
#title
Carousel with a lightbox on top

#description
`<PhotoCarousel>` wraps Embla with first-class support for thumbnails, counter, autoplay, and a lightbox overlay. Works on desktop and touch.

#default
::demo-carousel
::
::

::u-container
  :::u-page-grid{class="pb-12 xl:pb-24"}
    :::landing-feature
    ---
    title: Justified rows, columns, masonry
    description: Three built-in layouts with responsive breakpoints and function-based spacing.
    icon: i-lucide-layout-grid
    to: /docs/components/photo-album
    ---
    :::
    :::landing-feature
    ---
    title: Shared lightbox
    description: One `<PhotoGroup>` lets any number of albums share a single lightbox and navigation.
    icon: i-lucide-layers
    to: /docs/components/photo-group
    ---
    :::
    :::landing-feature
    ---
    title: Pinch, pan, zoom
    description: Touch-first lightbox with spring physics, pinch-to-zoom, pan, and swipe-to-dismiss.
    icon: i-lucide-hand
    to: /docs/concepts/transitions
    ---
    :::
    :::landing-feature
    ---
    title: Embla carousel
    description: A carousel with thumbnails, counter, autoplay, and lightbox integration out of the box.
    icon: i-lucide-images
    to: /docs/components/photo-carousel
    ---
    :::
    :::landing-feature
    ---
    title: @nuxt/image ready
    description: Detects `@nuxt/image`, routes all images through it, and emits proper `srcset` and `sizes`.
    icon: i-lucide-image
    to: /docs/concepts/image-providers
    ---
    :::
    :::landing-feature
    ---
    title: Headless primitives
    description: Build your own layout or custom lightbox with the same primitives the recipes ship on.
    icon: i-lucide-blocks
    to: /docs/guides/custom-lightbox
    ---
    :::
  :::
::

::page-section-cta
::
