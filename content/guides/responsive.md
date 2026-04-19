---
title: Responsive Configuration
description: Container-width-aware layout settings using ResponsiveParameter and the responsive() helper.
navigation: true
---

# Responsive Configuration

Many layout props in nuxt-photo accept a `ResponsiveParameter` — a value that can change based on the album's container width. This lets you adjust spacing, column count, row height, and more without media queries.

## The ResponsiveParameter Type

```ts
type ResponsiveParameter<T = number> = T | ((containerWidth: number) => T)
```

A `ResponsiveParameter` is either:
- A **static value** — same at every container width
- A **function** that receives the container width and returns a value

## Three Ways to Use It

### 1. Static value

```vue
<PhotoAlbum :photos="photos" :spacing="8" />
```

### 2. Inline function

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="(w) => w < 600 ? 4 : 8"
/>
```

### 3. Breakpoint map with `responsive()`

```vue
<PhotoAlbum
  :photos="photos"
  :spacing="responsive({ 0: 4, 600: 8, 900: 12 })"
/>
```

## The responsive() Helper

`responsive()` creates a function from a breakpoint map. Keys are minimum container widths in pixels; the largest matching breakpoint wins (mobile-first).

```ts
import { responsive } from '@nuxt-photo/core'
// Auto-imported in Nuxt

// 2 columns below 600px, 3 at 600–899px, 4 at 900px+
const columns = responsive({ 0: 2, 600: 3, 900: 4 })

columns(400)   // → 2
columns(600)   // → 3
columns(750)   // → 3
columns(900)   // → 4
columns(1400)  // → 4
```

::callout{type="info"}
The breakpoints refer to the **album container width**, not the viewport width. This makes the behavior predictable regardless of where the album is placed in your layout.
::

## Props That Accept ResponsiveParameter

| Component | Prop | Type |
|---|---|---|
| `PhotoAlbum` | `spacing` | `ResponsiveParameter<number>` |
| `PhotoAlbum` | `padding` | `ResponsiveParameter<number>` |
| Rows layout | `targetRowHeight` | `ResponsiveParameter<number>` |
| Columns layout | `columns` | `ResponsiveParameter<number>` |
| Masonry layout | `columns` | `ResponsiveParameter<number>` |

## Full Example

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'masonry',
    columns: responsive({ 0: 1, 480: 2, 768: 3, 1200: 4 }),
  }"
  :spacing="responsive({ 0: 4, 480: 6, 768: 8, 1200: 12 })"
  :padding="responsive({ 0: 0, 768: 4 })"
/>
```

This produces:
- **< 480px:** 1 column, 4px spacing, no padding
- **480–767px:** 2 columns, 6px spacing, no padding
- **768–1199px:** 3 columns, 8px spacing, 4px padding
- **≥ 1200px:** 4 columns, 12px spacing, 4px padding

## Breakpoint Snapping

To prevent re-layout on tiny width changes, combine `responsive()` with the `breakpoints` prop on `PhotoAlbum`:

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
  :breakpoints="[375, 600, 768, 900, 1200]"
/>
```

The container width is snapped to the nearest breakpoint before being passed to the responsive functions. See [SSR and Performance](/docs/guides/ssr-and-performance) for more details.
