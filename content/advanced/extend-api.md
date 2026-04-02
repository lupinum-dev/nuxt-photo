---
title: Extend API
description: Build a completely custom lightbox using the full engine and injection keys.
navigation: true
---

# Extend API

The extend API gives you full control over the lightbox system. Import from `@nuxt-photo/vue/extend` to access injection keys, context types, and internal types for building custom lightbox implementations.

## Import Path

```ts
import {
  // Injection keys
  LightboxContextKey,
  LightboxSlideRendererKey,
  LightboxComponentKey,
  LightboxSlotsKey,
  LightboxDefaultsKey,
  ImageAdapterKey,
  PhotoGroupContextKey,

  // Role-based context interfaces
  type LightboxContext,
  type LightboxConsumerAPI,
  type LightboxRenderState,
  type LightboxDOMBindings,

  // Other types
  type LightboxSlideRenderer,
  type PhotoGroupContext,
  type LightboxSlotOverrides,
  type LightboxDefaults,
  type LightboxTransitionOption,
} from '@nuxt-photo/vue/extend'
```

## Injection Keys

These keys are used with Vue's `provide` / `inject`:

| Key | Type | Description |
|---|---|---|
| `LightboxContextKey` | `LightboxContext` | The full lightbox engine context — a typed intersection of `LightboxConsumerAPI & LightboxRenderState & LightboxDOMBindings`. Provided by `useLightboxProvider`. |
| `LightboxSlideRendererKey` | `(photo) => LightboxSlideRenderer \| null` | Custom slide renderer lookup function. |
| `LightboxComponentKey` | `Component` | Override the lightbox component globally. Provide this in `app.vue` to replace the default lightbox everywhere. |
| `LightboxSlotsKey` | `Ref<LightboxSlotOverrides>` | Slot overrides for toolbar, caption, slide. Used internally by PhotoGroup and PhotoAlbum. |
| `LightboxDefaultsKey` | `LightboxDefaults` | Global defaults (e.g., `minZoom`). Provided by the Nuxt module's defaults plugin. |
| `ImageAdapterKey` | `ImageAdapter` | Default image adapter. Provided by the `@nuxt/image` integration plugin. |
| `PhotoGroupContextKey` | `PhotoGroupContext` | Group context for auto-collection. Provided by PhotoGroup. |

## Building a Custom Lightbox

### Step 1: Create the lightbox component

```vue [components/MyLightbox.vue]
<script setup>
import { useLightboxInject } from '@nuxt-photo/vue/extend'

// Access the full context provided by useLightboxProvider
const ctx = useLightboxInject('MyLightbox')
</script>

<template>
  <LightboxRoot>
    <LightboxOverlay />
    <LightboxPortal />

    <LightboxViewport v-slot="{ photos }">
      <LightboxSlide
        v-for="(photo, i) in photos"
        :key="photo.id"
        :photo="photo"
        :index="i"
      />
    </LightboxViewport>

    <LightboxControls v-slot="{ prev, next, close, activeIndex, count, isZoomedIn, toggleZoom }">
      <div class="my-controls">
        <button @click="prev">←</button>
        <span>{{ activeIndex + 1 }} / {{ count }}</span>
        <button @click="next">→</button>
        <button @click="toggleZoom">{{ isZoomedIn ? 'Fit' : 'Zoom' }}</button>
        <button @click="close">✕</button>
      </div>
    </LightboxControls>

    <LightboxCaption v-slot="{ photo }">
      <div class="my-caption">
        <h2>{{ photo.caption }}</h2>
        <p>{{ photo.description }}</p>
      </div>
    </LightboxCaption>
  </LightboxRoot>
</template>
```

### Step 2: Use it

Pass your component directly:

```vue
<PhotoAlbum :photos="photos" :lightbox="MyLightbox" />
```

Or provide it globally:

```vue [app.vue]
<script setup>
import { LightboxComponentKey } from '@nuxt-photo/vue/extend'
import MyLightbox from '~/components/MyLightbox.vue'

provide(LightboxComponentKey, MyLightbox)
</script>

<template>
  <NuxtPage />
</template>
```

## Typed Context Structure

The `LightboxContext` type is split into three role-based interfaces. This lets you type-narrow to only the slice your component needs:

### `LightboxConsumerAPI` — app code & recipe components

What you use to control the lightbox from the outside.

```ts
interface LightboxConsumerAPI {
  photos: ComputedRef<PhotoItem[]>
  count: ComputedRef<number>
  activeIndex: Ref<number>
  activePhoto: ComputedRef<PhotoItem>
  isOpen: ComputedRef<boolean>
  open: (photoOrIndex?: PhotoItem | number) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  toggleZoom: () => void
}
```

### `LightboxRenderState` — primitive components (styling & visibility)

Reactive state that drives the visual appearance of overlays, slides, and chrome.

```ts
interface LightboxRenderState {
  zoomState: Ref<ZoomState>
  panState: Ref<PanState>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  ghostSrc: Ref<string>
  ghostStyle: Ref<CSSProperties>
  hiddenThumbIndex: Ref<number | null>
  overlayOpacity: Ref<number>
  mediaOpacity: Ref<number>
  chromeOpacity: Ref<number>
  uiVisible: Ref<boolean>
  closeDragY: Ref<number>
  transitionInProgress: ComputedRef<boolean>
  chromeStyle: ComputedRef<CSSProperties>
  closeDragRatio: ComputedRef<number>
  backdropStyle: ComputedRef<CSSProperties>
  lightboxUiStyle: ComputedRef<CSSProperties>
  gesturePhase: Ref<GestureMode>
  getSlideFrameStyle: (photo: PhotoItem) => CSSProperties
  getSlideEffectStyle: (index: number) => CSSProperties
}
```

### `LightboxDOMBindings` — event handlers & ref callbacks

Wire these into your template to connect pointer/wheel events and DOM refs.

```ts
interface LightboxDOMBindings {
  mediaAreaRef: Ref<HTMLElement | null>
  emblaRef: Ref<HTMLElement | null>
  setThumbRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideZoomRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => void
}
```

### Full context

`LightboxContext = LightboxConsumerAPI & LightboxRenderState & LightboxDOMBindings`

When you inject or call `useLightboxContext`, you get the full intersection. But you can type-narrow for cleaner component code:

```ts
import { inject } from 'vue'
import { LightboxContextKey, type LightboxConsumerAPI } from '@nuxt-photo/vue/extend'

// Only use the consumer slice — your component doesn't touch DOM bindings or render state
const { open, close, next, prev, activePhoto } = inject(LightboxContextKey)! as LightboxConsumerAPI
```

## useLightboxContext (Full Engine)

For maximum control, use `useLightboxContext` directly:

```ts
import { useLightboxContext } from '@nuxt-photo/vue/extend'

const ctx = useLightboxContext(photos, 'auto', 1)
```

The returned object satisfies `LightboxContext` — see the three interfaces above for the full property list.

## PhotoGroupContext

If you need to interact with the photo group system programmatically:

```ts
type PhotoGroupContext = {
  mode: 'auto' | 'explicit'
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null): void
  unregister(id: symbol): void
  open(photoOrIndex: PhotoItem | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}
```

Inject it with:

```ts
const group = inject(PhotoGroupContextKey)
```

This is how `Photo` and `PhotoAlbum` register themselves with a parent `PhotoGroup`.
