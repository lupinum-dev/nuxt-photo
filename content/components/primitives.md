---
title: Primitives
description: Low-level lightbox and photo building blocks from @nuxt-photo/vue.
navigation: true
---

# Primitive Components

The primitive components from `@nuxt-photo/vue` are the building blocks of the lightbox system. They're designed for **building custom lightbox UIs** — if you just want a working gallery, use the [recipe components](/docs/components/photo-album) instead.

All primitives require a lightbox context provided by [`useLightboxProvider`](/docs/composables/use-lightbox-provider). They read shared state via Vue's provide/inject system.

## Example: Custom Lightbox

```vue
<script setup>
const photos = [
  { id: 1, src: '/a.jpg', width: 1600, height: 900 },
  { id: 2, src: '/b.jpg', width: 900, height: 1200 },
]
const { open, setThumbRef } = useLightboxProvider(photos)
</script>

<template>
  <!-- Thumbnails -->
  <div v-for="(photo, i) in photos" :key="photo.id">
    <PhotoTrigger :photo="photo" :index="i" v-slot="{ photo: p, hidden }">
      <img
        :ref="setThumbRef(i)"
        :src="p.src"
        :style="{ opacity: hidden ? 0 : 1 }"
      />
    </PhotoTrigger>
  </div>

  <!-- Lightbox -->
  <LightboxRoot>
    <LightboxOverlay />
    <LightboxPortal />
    <LightboxViewport v-slot="{ photos: slidePhotos }">
      <LightboxSlide
        v-for="(photo, i) in slidePhotos"
        :key="photo.id"
        :photo="photo"
        :index="i"
      />
    </LightboxViewport>
    <LightboxControls v-slot="{ prev, next, close, activeIndex, count }">
      <button @click="prev">Prev</button>
      <span>{{ activeIndex + 1 }} / {{ count }}</span>
      <button @click="next">Next</button>
      <button @click="close">Close</button>
    </LightboxControls>
    <LightboxCaption v-slot="{ photo }">
      <h2>{{ photo.caption }}</h2>
      <p>{{ photo.description }}</p>
    </LightboxCaption>
  </LightboxRoot>
</template>
```

---

## LightboxRoot

Teleports the lightbox to `<body>` and conditionally renders its content when the lightbox is open.

**Props:** None

**Slots:**

| Slot      | Props | Description                                          |
| --------- | ----- | ---------------------------------------------------- |
| `default` | —     | Lightbox content (overlay, viewport, controls, etc.) |

---

## LightboxOverlay

Renders the backdrop behind the lightbox. Clicking it closes the lightbox.

**Props:** None

**Slots:**

| Slot      | Props | Description                       |
| --------- | ----- | --------------------------------- |
| `default` | —     | Optional custom backdrop content. |

The backdrop style (opacity, blur) is driven by the lightbox context and animates during transitions.

---

## LightboxViewport

The main media area that hosts slides. Handles pointer events for gestures (swipe, pan, pinch-to-zoom) and mouse wheel zoom.

**Props:** None

**Slots:**

| Slot      | Props                                                             | Description                                                                                                     |
| --------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `default` | `{ photos: PhotoItem[], viewportRef: Ref, mediaOpacity: number }` | Render slides here. `viewportRef` is the carousel container ref. `mediaOpacity` fades during close transitions. |

---

## LightboxSlide

Renders a single slide inside the viewport. Uses a three-layer div structure (effect → frame → zoom) to support pan and zoom transforms.

**Props:**

| Prop          | Type        | Default     | Description                               |
| ------------- | ----------- | ----------- | ----------------------------------------- |
| `photo`       | `PhotoItem` | —           | **Required.** The photo for this slide.   |
| `index`       | `number`    | —           | **Required.** The slide index.            |
| `effectClass` | `string`    | `undefined` | CSS class for the outer effect wrapper.   |
| `frameClass`  | `string`    | `undefined` | CSS class for the frame (sizing) wrapper. |
| `zoomClass`   | `string`    | `undefined` | CSS class for the zoom transform wrapper. |
| `imgClass`    | `string`    | `undefined` | CSS class for the `<img>` element.        |

**Slots:**

| Slot      | Props                                                                | Description                                                                                                      |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `default` | `{ photo: PhotoItem, index: number, width: number, height: number }` | Custom slide content. Replaces the default `PhotoImage`. `width` and `height` are the computed frame dimensions. |

---

## LightboxControls

Wrapper for navigation and action buttons. Applies chrome visibility styles (fades when zoomed or during gestures).

**Props:** None

**Slots:**

| Slot      | Props                                                                                                                                                                                                                                      | Description                                                                                                                |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `default` | `{ activeIndex: number, activePhoto: PhotoItem, photos: PhotoItem[], count: number, isZoomedIn: boolean, zoomAllowed: boolean, controlsDisabled: boolean, next: () => void, prev: () => void, close: () => void, toggleZoom: () => void }` | Build your navigation UI with these reactive values and action functions. `controlsDisabled` is `true` during transitions. |

---

## LightboxCaption

Displays caption content for the active slide.

**Props:** None

**Slots:**

| Slot      | Props                                       | Description             |
| --------- | ------------------------------------------- | ----------------------- |
| `default` | `{ photo: PhotoItem, activeIndex: number }` | Custom caption content. |

---

## LightboxPortal

Renders the **ghost image** used for FLIP open/close transitions. This is the floating image element that animates from the thumbnail position to the lightbox position (and back).

**Props:** None

**Slots:** None

Place this inside `LightboxRoot`. It renders conditionally during transitions and is marked `aria-hidden="true"`.

---

## PhotoTrigger

A clickable wrapper for thumbnails. Opens the lightbox when clicked (or activated via keyboard).

**Props:**

| Prop    | Type        | Default | Description                                            |
| ------- | ----------- | ------- | ------------------------------------------------------ |
| `photo` | `PhotoItem` | —       | **Required.** The photo this trigger represents.       |
| `index` | `number`    | —       | **Required.** The index of this photo in the lightbox. |

**Slots:**

| Slot      | Props                                                  | Description                                                                                                     |
| --------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `default` | `{ photo: PhotoItem, index: number, hidden: boolean }` | Custom thumbnail content. `hidden` is `true` when this thumbnail should be invisible (during FLIP transitions). |

Renders as a `<div>` with `role="button"`, `tabindex="0"`, and keyboard event handlers for Enter and Space.

---

## PhotoImage

Renders an `<img>` element with attributes resolved by the image adapter.

**Props:**

| Prop      | Type                | Default     | Description                                                                                         |
| --------- | ------------------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `photo`   | `PhotoItem`         | —           | **Required.** The photo to render.                                                                  |
| `context` | `ImageContext`      | `'thumb'`   | Image context: `'thumb'`, `'slide'`, or `'preload'`. Determines which srcset the adapter generates. |
| `adapter` | `ImageAdapter`      | `undefined` | Custom image adapter. Falls back to the injected adapter or the native adapter.                     |
| `loading` | `'lazy' \| 'eager'` | `'lazy'`    | Image loading strategy.                                                                             |
| `sizes`   | `string`            | `undefined` | Override the adapter-computed `sizes` attribute.                                                    |

**Slots:** None

Renders a native `<img>` with `draggable="false"`, binding `src`, `srcset`, `sizes`, `width`, `height`, `alt`, and `loading` from the resolved image source.
