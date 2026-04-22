---
title: PhotoGroup
description: Groups multiple photos or albums under a single shared lightbox.
navigation: true
---

# PhotoGroup

The `PhotoGroup` component provides a shared lightbox context for multiple [`Photo`](/docs/components/photo) or [`PhotoAlbum`](/docs/components/photo-album) components. It supports two modes: **auto-collection** (children register themselves) and **explicit** (you provide the photos array).

## Usage

### Auto-collection mode

When you don't pass a `:photos` prop, `PhotoGroup` collects photos from its child `Photo` and `PhotoAlbum` components:

```vue
<PhotoGroup>
  <Photo :photo="hero" />
  <p>Some text between photos</p>
  <Photo :photo="detail1" />
  <Photo :photo="detail2" />
</PhotoGroup>
```

All three photos share one lightbox. Clicking any photo lets you navigate to the others.

### Multiple albums sharing a lightbox

```vue
<PhotoGroup>
  <h2>Landscapes</h2>
  <PhotoAlbum :photos="landscapes" layout="rows" />

  <h2>Portraits</h2>
  <PhotoAlbum :photos="portraits" layout="columns" />
</PhotoGroup>
```

### Explicit photos mode

Pass `:photos` directly for programmatic control:

```vue
<PhotoGroup :photos="allPhotos" v-slot="{ open }">
  <button @click="open(0)">Open first photo</button>
  <button @click="open(5)">Open sixth photo</button>
</PhotoGroup>
```

### Headless mode

Use the scoped slot for fully custom layouts while keeping the lightbox:

```vue
<PhotoGroup :photos="photos" v-slot="{ open, setThumbRef }">
  <div class="custom-grid">
    <div
      v-for="(photo, i) in photos"
      :key="photo.id"
      :ref="setThumbRef(i)"
      @click="open(i)"
    >
      <img :src="photo.thumbSrc || photo.src" :alt="photo.alt" />
    </div>
  </div>
</PhotoGroup>
```

By providing `setThumbRef`, you enable FLIP transitions from your custom thumbnails to the lightbox.

### Programmatic open via ref

```vue
<script setup>
const groupRef = ref()

function openGallery() {
  groupRef.value.open(0)
}
</script>

<template>
  <PhotoGroup ref="groupRef">
    <PhotoAlbum :photos="photos" />
  </PhotoGroup>
  <button @click="openGallery">View Gallery</button>
</template>
```

### With CMS data

```vue
<script setup>
import type { PhotoAdapter } from '@nuxt-photo/core'

const adapter: PhotoAdapter = (item) => ({
  id: item.id,
  src: item.url,
  width: item.dimensions.width,
  height: item.dimensions.height,
  alt: item.altText,
})
</script>

<template>
  <PhotoGroup :photos="cmsItems" :photo-adapter="adapter">
    <PhotoAlbum :photos="cmsItems" :photo-adapter="adapter" />
  </PhotoGroup>
</template>
```

## Props

| Prop          | Type                       | Default     | Description                                                                                                                                                          |
| ------------- | -------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `photos`      | `PhotoItem[] \| any[]`     | `undefined` | Explicit photos list. When provided, the group operates in **explicit** mode and ignores child registrations. When omitted, the group uses **auto-collection** mode. |
| `itemAdapter` | `PhotoAdapter`             | `undefined` | Transforms each item in `photos` into a `PhotoItem`. Only used in explicit mode.                                                                                     |
| `lightbox`    | `boolean \| Component`     | `true`      | Lightbox to render. `true` = default lightbox, `false` = no lightbox, or pass a custom component.                                                                    |
| `transition`  | `LightboxTransitionOption` | `undefined` | Transition mode for lightbox open/close animations. See [Transitions guide](/docs/guides/transitions).                                                               |

## Slots

| Slot      | Props                                                                                                                                | Description                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `default` | `{ open: (photoOrIndex?: PhotoItem \| number) => Promise<void>, setThumbRef: (index: number) => (el: HTMLElement \| null) => void }` | Content area. In auto mode, place `Photo` or `PhotoAlbum` children here. In headless mode, use `open` and `setThumbRef` to build custom layouts. |
| `toolbar` | `{ activeIndex: number, activePhoto: PhotoItem, count: number }`                                                                     | Custom lightbox toolbar content.                                                                                                                 |
| `caption` | `{ photo: PhotoItem, activeIndex: number }`                                                                                          | Custom lightbox caption content.                                                                                                                 |
| `slide`   | `{ photo: PhotoItem, index: number, width: number, height: number }`                                                                 | Custom lightbox slide content.                                                                                                                   |

## Exposed Methods

Access these via a template ref:

| Method  | Signature                                               | Description                                                                          |
| ------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `open`  | `(photoOrIndex?: PhotoItem \| number) => Promise<void>` | Opens the lightbox. Pass a photo object, an index, or nothing (defaults to index 0). |
| `close` | `() => Promise<void>`                                   | Closes the lightbox with the configured transition.                                  |

## Behavior

- **Auto mode** (`photos` prop omitted): Child `Photo` and `PhotoAlbum` components register themselves via provide/inject. The order of photos matches DOM insertion order.
- **Explicit mode** (`photos` prop set): The provided array is used directly. Child registrations are ignored (a dev warning is logged if both are used).
- **Slot forwarding:** The `#toolbar`, `#caption`, and `#slide` slots are forwarded into the lightbox component via injection, so they work regardless of which lightbox is used.
- **Lightbox component resolution:** If `lightbox` is `true`, the group checks for an injected custom lightbox (via `LightboxComponentKey`) before falling back to the built-in `Lightbox`.
