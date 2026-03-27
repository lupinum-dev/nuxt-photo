---
title: Lightbox
description: How the lightbox works — navigation, keyboard shortcuts, and the viewer state machine.
navigation: true
---

# Lightbox

The lightbox is the full-screen photo viewer that opens when you click a photo. It supports keyboard navigation, touch gestures, and zoom.

## How It Works

Every `PhotoAlbum`, `PhotoGroup`, and `Photo` (with `lightbox` prop) creates a lightbox instance internally. When you click a photo:

1. The thumbnail's position is captured for the FLIP transition
2. The lightbox opens with an animated transition
3. The active photo is displayed at full viewport size
4. Navigation, gestures, and zoom become available
5. On close, the reverse transition animates back to the thumbnail

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `→` / `↓` | Next photo |
| `←` / `↑` | Previous photo |
| `Escape` | Close lightbox |

## Enabling and Disabling

The lightbox is enabled by default on all gallery components. Disable it with `lightbox={false}`:

```vue
<!-- No lightbox — photos are not clickable -->
<PhotoAlbum :photos="photos" :lightbox="false" />

<!-- No lightbox on the group -->
<PhotoGroup :lightbox="false">
  <PhotoAlbum :photos="photos" />
</PhotoGroup>
```

## Custom Lightbox Component

Pass a custom component instead of `true`:

```vue
<PhotoAlbum :photos="photos" :lightbox="MyCustomLightbox" />
```

Or provide a global lightbox override for your entire app:

```vue [app.vue]
<script setup>
import { LightboxComponentKey } from '@nuxt-photo/vue/extend'
import MyLightbox from '~/components/MyLightbox.vue'

provide(LightboxComponentKey, MyLightbox)
</script>
```

## Viewer State Machine

The lightbox follows a strict state machine:

```
closed → opening → open → closing → closed
```

| State | Description |
|---|---|
| `closed` | Lightbox is not rendered. |
| `opening` | Transition is playing (FLIP or fade). Controls are disabled. |
| `open` | Fully interactive — navigation, gestures, and zoom are available. |
| `closing` | Close transition is playing. Controls are disabled. |

The `ViewerState` type represents this:

```ts
type ViewerState =
  | { status: 'closed' }
  | { status: 'opening'; activeId: string | number }
  | { status: 'open'; activeId: string | number }
  | { status: 'closing'; activeId: string | number }
```

## Body Scroll Locking

When the lightbox opens, body scrolling is locked to prevent the page from scrolling behind the overlay. This is handled automatically and restored when the lightbox closes.

## Related

- [Transitions guide](/docs/guides/transitions) — FLIP animations and transition modes
- [Gestures and Zoom guide](/docs/guides/gestures-and-zoom) — touch and mouse interactions
- [Primitives reference](/docs/components/primitives) — build a custom lightbox from scratch
