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

  // Types
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
| `LightboxContextKey` | `LightboxContext` | The full lightbox engine context (50+ properties). Provided by `useLightboxProvider`. |
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

## useLightboxContext (Full Engine)

For maximum control, use `useLightboxContext` directly. It returns 50+ reactive properties:

```ts
import { useLightboxContext } from '@nuxt-photo/vue'

const ctx = useLightboxContext(photos, 'auto', 1)
```

### Key properties (partial list):

**Control:**
- `open(index)`, `close()`, `next()`, `prev()`, `toggleZoom()`

**State:**
- `isOpen`, `activeIndex`, `activePhoto`, `count`, `photos`
- `viewerState` — the full state machine (`closed | opening | open | closing`)

**Zoom & Pan:**
- `zoomState` — `{ fit, secondary, max, current }`
- `panState` — `{ x, y }`
- `isZoomedIn`, `zoomAllowed`
- `panzoomMotion` — full spring animation state

**Transitions:**
- `ghostVisible`, `ghostSrc`, `ghostStyle` — ghost image for FLIP
- `hiddenThumbIndex` — which thumbnail to hide
- `backdropStyle`, `mediaOpacity`, `chromeStyle` — animated styles

**Geometry:**
- `mediaAreaRef` — ref to the media container element
- `areaMetrics` — `{ left, top, width, height }` of the media area

**Events:**
- `onMediaPointerDown`, `onMediaPointerMove`, `onMediaPointerUp`, `onMediaPointerCancel`
- `onWheel`
- `handleBackdropClick`

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
