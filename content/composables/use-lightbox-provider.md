---
title: useLightboxProvider
description: Creates a lightbox context and provides it to child components.
navigation: true
---

# useLightboxProvider

Creates a full lightbox context and provides it to child components via Vue's provide/inject. This is the composable for **building custom lightbox components** — the middle tier between [`useLightbox`](/docs/composables/use-lightbox) (consumer-only) and the framework-free engine layer.

## Signature

```ts
function useLightboxProvider(
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
  },
): {
  open: (index?: number) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  isOpen: Ref<boolean>
  activeIndex: Ref<number>
  activePhoto: ComputedRef<PhotoItem | null>
  photos: ComputedRef<PhotoItem[]>
  count: ComputedRef<number>
  setThumbRef: (index: number) => (el: HTMLElement | null) => void
  hiddenThumbIndex: Ref<number | null>
}
```

## Parameters

| Parameter              | Type                                                  | Description                                                                                                      |
| ---------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `photosInput`          | `MaybeRef<PhotoItem \| PhotoItem[]>`                  | A single photo or array of photos. Can be a ref for reactive updates.                                            |
| `options.transition`   | `LightboxTransitionOption`                            | Transition mode: `'flip'`, `'fade'`, `'auto'`, `'none'`, or a `TransitionModeConfig` object.                     |
| `options.resolveSlide` | `(photo: PhotoItem) => LightboxSlideRenderer \| null` | Custom slide renderer lookup. Return a render function for custom slides, or `null` for the default image slide. |
| `options.minZoom`      | `number`                                              | Minimum zoom level. `1` means no zoom below fit-to-screen.                                                       |

## Return Value

Returns everything from [`useLightbox`](/docs/composables/use-lightbox), plus:

| Property           | Type                                                   | Description                                                                                                                                 |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `photos`           | `ComputedRef<PhotoItem[]>`                             | The normalized photos array.                                                                                                                |
| `setThumbRef`      | `(index: number) => (el: HTMLElement \| null) => void` | Register a thumbnail DOM element for FLIP transitions. Call `setThumbRef(i)` to get a ref callback, then bind it to your thumbnail element. |
| `hiddenThumbIndex` | `Ref<number \| null>`                                  | Index of the thumbnail that should be hidden during a FLIP transition, or `null`.                                                           |

## Usage

### Custom lightbox with primitives

```vue
<script setup>
const photos = [
  { id: 1, src: '/a.jpg', width: 1600, height: 900 },
  { id: 2, src: '/b.jpg', width: 900, height: 1200 },
]

const { open, close, isOpen, activePhoto, setThumbRef } = useLightboxProvider(
  photos,
  {
    transition: 'auto',
  },
)
</script>

<template>
  <!-- Thumbnails -->
  <div v-for="(photo, i) in photos" :key="photo.id">
    <PhotoTrigger :photo="photo" :index="i">
      <template #default="{ hidden }">
        <img
          :ref="setThumbRef(i)"
          :src="photo.src"
          :style="{ opacity: hidden ? 0 : 1 }"
        />
      </template>
    </PhotoTrigger>
  </div>

  <!-- Lightbox UI built with primitives -->
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
      <button @click="prev">Previous</button>
      <span>{{ activeIndex + 1 }} / {{ count }}</span>
      <button @click="next">Next</button>
      <button @click="close">Close</button>
    </LightboxControls>
  </LightboxRoot>
</template>
```

### With custom slide renderer

```vue
<script setup>
const { open } = useLightboxProvider(photos, {
  resolveSlide: (photo) => {
    if (photo.meta?.type === 'video') {
      return (props) => h('video', { src: photo.meta.videoUrl, controls: true })
    }
    return null // default image slide
  },
})
</script>
```

## When to Use

| Scenario                                 | Composable                                      |
| ---------------------------------------- | ----------------------------------------------- |
| Just need open/close/navigate            | [`useLightbox`](/docs/composables/use-lightbox) |
| Building custom lightbox with primitives | `useLightboxProvider`                           |
| Framework-free orchestration access      | `@nuxt-photo/engine`                            |

::callout{type="info"}
`useLightboxProvider` must be called inside a component's `setup()` function. It provides the lightbox context to all descendant components — this is required for the [primitive components](/docs/components/primitives) to work.
::
