---
title: useContainerWidth
description: Track an element's width via ResizeObserver with breakpoint snapping.
navigation: true
---

# useContainerWidth

Tracks an element's width using `ResizeObserver` with optional breakpoint snapping and scrollbar-oscillation detection. SSR-safe — it initializes from a default width and only starts observing after mount.

## Signature

```ts
function useContainerWidth(
  containerRef: Ref<HTMLElement | null>,
  options?: {
    defaultContainerWidth?: number
    breakpoints?: readonly number[]
  },
): {
  containerWidth: Ref<number>
}
```

## Parameters

| Parameter                       | Type                       | Description                                                                                                |
| ------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `containerRef`                  | `Ref<HTMLElement \| null>` | Ref to the DOM element to observe.                                                                         |
| `options.defaultContainerWidth` | `number`                   | Pre-render width for SSR. The composable uses this value before mount so the layout can run server-side.   |
| `options.breakpoints`           | `readonly number[]`        | Snap the observed width to the largest breakpoint ≤ actual width. Prevents re-layout on sub-pixel changes. |

## Return Value

| Property         | Type          | Description                                                                                      |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `containerWidth` | `Ref<number>` | The current (possibly snapped) container width in pixels. `0` before mount if no default is set. |

## Usage

```vue
<script setup>
const containerRef = (ref < HTMLElement) | (null > null)

const { containerWidth } = useContainerWidth(containerRef, {
  defaultContainerWidth: 1200,
  breakpoints: [375, 600, 900, 1200],
})
</script>

<template>
  <div ref="containerRef">
    <p>Container width: {{ containerWidth }}px</p>
  </div>
</template>
```

## Breakpoint Snapping

When `breakpoints` are provided, the observed width is snapped **down** to the largest breakpoint that is less than or equal to the actual width. This has two benefits:

1. **Prevents sub-pixel re-layout:** Small width changes (e.g., from rounding) don't trigger a full layout recalculation.
2. **Scrollbar oscillation detection:** When content height causes a scrollbar to appear (reducing width), which then removes content below the fold (removing scrollbar, restoring width), the composable detects this bounce and settles on the smaller width.

For example, with breakpoints `[375, 600, 900, 1200]`:

| Actual width | Snapped width                        |
| ------------ | ------------------------------------ |
| 1440px       | 1200px                               |
| 1200px       | 1200px                               |
| 1150px       | 900px                                |
| 620px        | 600px                                |
| 400px        | 375px                                |
| 200px        | 187px (half of 375, synthetic floor) |

## SSR Behavior

- Before mount: `containerWidth` equals `defaultContainerWidth` (or `0` if not set).
- After mount: The composable reads the actual element width and starts the `ResizeObserver`.
- When `defaultContainerWidth` matches a breakpoint and the actual width snaps to the same breakpoint, there's **zero CLS** — the server-rendered layout matches the client-hydrated layout exactly.

::callout{type="info"}
This composable is used internally by `PhotoAlbum` — you only need it directly if you're building a custom layout component.
::
