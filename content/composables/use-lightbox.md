---
title: useLightbox
description: Consumer composable for controlling a lightbox.
navigation: true
---

# useLightbox

The simplest composable for creating and controlling a lightbox. It creates a lightbox context but does **not** provide it to child components — use [`useLightboxProvider`](/docs/composables/use-lightbox-provider) if you need children to access the context.

## Signature

```ts
function useLightbox(photosInput: MaybeRef<PhotoItem | PhotoItem[]>): {
  open: (index?: number) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  isOpen: Ref<boolean>
  activeIndex: Ref<number>
  activePhoto: ComputedRef<PhotoItem | null>
  count: ComputedRef<number>
}
```

## Parameters

| Parameter     | Type                                 | Description                                                              |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `photosInput` | `MaybeRef<PhotoItem \| PhotoItem[]>` | A single photo or an array of photos. Can be a ref for reactive updates. |

## Return Value

| Property      | Type                                | Description                                                                                                                |
| ------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `open`        | `(index?: number) => Promise<void>` | Opens the lightbox at the given index (defaults to 0). Returns a promise that resolves when the open transition completes. |
| `close`       | `() => Promise<void>`               | Closes the lightbox. Returns a promise that resolves when the close transition completes.                                  |
| `next`        | `() => void`                        | Navigate to the next photo.                                                                                                |
| `prev`        | `() => void`                        | Navigate to the previous photo.                                                                                            |
| `isOpen`      | `Ref<boolean>`                      | Whether the lightbox is currently open.                                                                                    |
| `activeIndex` | `Ref<number>`                       | Index of the currently active photo.                                                                                       |
| `activePhoto` | `ComputedRef<PhotoItem \| null>`    | The currently active photo object, or `null` when closed.                                                                  |
| `count`       | `ComputedRef<number>`               | Total number of photos.                                                                                                    |

## Usage

```vue
<script setup>
const photos = ref([
  { id: 1, src: '/a.jpg', width: 1600, height: 900 },
  { id: 2, src: '/b.jpg', width: 900, height: 1200 },
])

const { open, close, isOpen, activeIndex, count } = useLightbox()
</script>

<template>
  <button @click="open(0)">Open Gallery</button>
  <p v-if="isOpen">Viewing {{ activeIndex + 1 }} of {{ count }}</p>
</template>
```

## When to Use

- You need programmatic control over a lightbox (open/close/navigate)
- You're building a simple integration where children don't need the context
- You want to track lightbox state reactively

For most gallery use cases, [`PhotoAlbum`](/docs/components/photo-album) and [`PhotoGroup`](/docs/components/photo-group) handle lightbox creation internally. Use `useLightbox` when you need to control the lightbox from outside the component tree.

::callout{type="info"}
`useLightbox` must be called inside a component's `setup()` function.
::
