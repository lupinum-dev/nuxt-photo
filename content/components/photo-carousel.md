---
title: PhotoCarousel
description: A swipeable inline carousel with thumbnails, captions, autoplay, and optional lightbox.
navigation: true
---

# PhotoCarousel

`PhotoCarousel` is an inline swipeable carousel — ideal for blog posts, docs pages, and landing sections. Arrows, thumbnails, counter, captions, autoplay, and optional lightbox are all built in, each toggleable with a single prop. Powered by [Embla Carousel](https://www.embla-carousel.com/).

## Usage

### Basic

```vue
<script setup>
const photos = [
  { id: 1, src: '/photos/a.jpg', width: 1600, height: 1000 },
  { id: 2, src: '/photos/b.jpg', width: 1600, height: 1000 },
  { id: 3, src: '/photos/c.jpg', width: 1600, height: 1000 },
]
</script>

<template>
  <PhotoCarousel :photos="photos" />
</template>
```

Defaults: arrows on, thumbnails on, counter on, dots off, lightbox off, autoplay off.

### Toggling controls

```vue
<PhotoCarousel
  :photos="photos"
  :show-thumbnails="false"
  :show-dots="true"
  :show-counter="false"
/>
```

### Autoplay

```vue
<!-- boolean shorthand -->
<PhotoCarousel :photos="photos" :autoplay="true" />

<!-- explicit options -->
<PhotoCarousel :photos="photos" :autoplay="{ delay: 4000, stopOnInteraction: true }" />
```

When `autoplay` is truthy, PhotoCarousel prepends Embla's Autoplay plugin internally. Any user-supplied plugin named `autoplay` in the `plugins` array is filtered out (the prop wins) and a dev warning is emitted.

### With lightbox

```vue
<PhotoCarousel :photos="photos" :lightbox="true" />
```

The inline carousel becomes the thumbnail for a full lightbox. Click any slide to open it; the ghost transition animates from the on-screen slide.

### Multi-slide view

```vue
<PhotoCarousel
  :photos="photos"
  slide-size="40%"
  slide-aspect="1 / 1"
  gap="1rem"
  :show-thumbnails="false"
/>
```

### Full Embla options

Everything Embla accepts is passed through via `options`:

```vue
<PhotoCarousel
  :photos="photos"
  :options="{ loop: true, align: 'center', slidesToScroll: 2 }"
  :thumbs-options="{ dragFree: true, containScroll: 'keepSnaps' }"
/>
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `photos` | `PhotoItem[] \| any[]` | — | Array of photos. |
| `photoAdapter` | `PhotoAdapter` | — | Transforms each item into a `PhotoItem`. |
| `adapter` | `ImageAdapter` | — | Image adapter for src/srcset/sizes. |
| `options` | `EmblaOptionsType` | `{ loop: false, align: 'start', containScroll: 'trimSnaps' }` | Main Embla options (shallow-merged). |
| `plugins` | `EmblaPluginType[]` | `[]` | Extra Embla plugins. |
| `thumbsOptions` | `EmblaOptionsType` | `{ containScroll: 'keepSnaps', dragFree: true }` | Thumbnail carousel Embla options. |
| `showArrows` | `boolean` | `true` | Show prev/next buttons. |
| `showThumbnails` | `boolean` | `true` | Show the thumbnail rail. |
| `showCounter` | `boolean` | `true` | Show the `n / total` counter. |
| `showDots` | `boolean` | `false` | Show dot navigation. |
| `autoplay` | `boolean \| AutoplayOptionsType` | `false` | Enable autoplay. |
| `slideSize` | `string` | `'100%'` | Width of each slide. |
| `slideAspect` | `string` | `'16 / 10'` | Slide aspect ratio. |
| `gap` | `string` | `'0.75rem'` | Gap between slides. |
| `thumbSize` | `string` | `'5.5rem'` | Thumbnail height. |
| `lightbox` | `boolean \| Component` | `false` | Enable lightbox on slide click. |
| `transition` | `LightboxTransitionOption` | — | Lightbox open/close transition. |

## Slots

Inline slots render inside the carousel itself. Lightbox slots forward to the internal `PhotoGroup`.

### Inline

| Slot | Props | Description |
|---|---|---|
| `slide` | `{ photo, index, selected, open }` | Replaces the default slide. |
| `thumb` | `{ photo, index, selected, goTo }` | Replaces the default thumbnail. |
| `caption` | `{ photo, index, count }` | Replaces the inline caption. |
| `controls` | `{ goToPrev, goToNext, canGoToPrev, canGoToNext, selectedIndex, snapCount, goTo }` | Full nav override. |
| `prev` / `next` | — | Arrow button content. |
| `dots` | `{ snaps, selectedIndex, goTo }` | Custom dot navigation. |

### Lightbox

| Slot | Forwards to |
|---|---|
| `lightbox-slide` | `PhotoGroup #slide` |
| `lightbox-caption` | `PhotoGroup #caption` |
| `lightbox-toolbar` | `PhotoGroup #toolbar` |

## Imperative handle

```vue
<script setup>
import { ref } from 'vue'

const carousel = ref()
</script>

<template>
  <PhotoCarousel ref="carousel" :photos="photos" />
  <button @click="carousel.goToNext()">Next</button>
</template>
```

Exposed: `emblaApi`, `thumbsApi`, `selectedIndex`, `goTo(i, instant?)`, `goToNext(instant?)`, `goToPrev(instant?)`, `selectedSnap()`, `reInit(options?, plugins?)`.

## CSS classes

| Class | Element |
|---|---|
| `.np-carousel` | Root container |
| `.np-carousel__viewport` | Embla viewport |
| `.np-carousel__container` | Slides wrapper |
| `.np-carousel__slide` | Individual slide |
| `.np-carousel__media` | Default `<img>` |
| `.np-carousel__controls` | Arrow overlay |
| `.np-carousel__arrow` | Arrow button |
| `.np-carousel__counter` | Counter pill |
| `.np-carousel__dots` | Dot nav container |
| `.np-carousel__dot` | Individual dot |
| `.np-carousel__thumbs` | Thumbnail rail |
| `.np-carousel__thumb` | Thumbnail button |
| `.np-carousel__caption` | Caption container |

Layout CSS variables on `.np-carousel`: `--np-carousel-slide-size`, `--np-carousel-slide-aspect`, `--np-carousel-gap`, `--np-carousel-thumb-size`, `--np-carousel-thumb-gap`.
