---
title: Layouts
description: The four layout algorithms — rows, columns, masonry, and bento.
navigation: true
---

# Layouts

`PhotoAlbum` supports four layout algorithms. Each produces a different visual arrangement of your photos.

## Rows (Justified)

The default layout. Photos are arranged in horizontal rows with justified widths — every row fills the container exactly. The algorithm uses a Knuth-Plass dynamic programming approach to find the optimal line breaks, minimizing the deviation from the target row height.

```vue
<PhotoAlbum :photos="photos" layout="rows" />

<!-- With custom target height -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'rows', targetRowHeight: 250 }"
/>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `targetRowHeight` | `ResponsiveParameter<number>` | `300` | Ideal row height. Rows may be taller or shorter depending on photo aspect ratios. |

**Best for:** Photo galleries where you want every image to be fully visible with no cropping. The justified layout handles mixed aspect ratios gracefully.

## Columns

Photos are distributed across equal-width columns. Each photo maintains its original aspect ratio, so column heights may differ.

```vue
<PhotoAlbum :photos="photos" layout="columns" />

<!-- With custom column count -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'columns', columns: 4 }"
/>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `columns` | `ResponsiveParameter<number>` | `3` | Number of columns. |

**Best for:** Uniform grids where you want consistent column widths. Photos are assigned to columns using a shortest-path algorithm that balances column heights.

## Masonry

Similar to columns, but photos are placed into the shortest column one at a time (greedy approach). This produces the classic Pinterest-style staggered layout.

```vue
<PhotoAlbum :photos="photos" layout="masonry" />

<!-- Responsive columns -->
<PhotoAlbum
  :photos="photos"
  :layout="{ type: 'masonry', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
/>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `columns` | `ResponsiveParameter<number>` | `3` | Number of columns. |

**Best for:** Layouts where preserving the original photo order matters less than minimizing wasted space. Masonry fills gaps more aggressively than columns.

## Bento

A CSS Grid-based layout where photos can span multiple columns and rows. Creates a magazine-style grid with varying tile sizes.

```vue
<PhotoAlbum :photos="photos" layout="bento" />

<!-- With custom options -->
<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'bento',
    columns: 4,
    rowHeight: 200,
    sizing: 'auto',
  }"
/>
```

| Option | Type | Default | Description |
|---|---|---|---|
| `columns` | `ResponsiveParameter<number>` | `3` | Number of grid columns. |
| `rowHeight` | `ResponsiveParameter<number>` | `280` | Height of each grid row in pixels. |
| `sizing` | `'auto' \| 'pattern' \| 'manual'` | `'auto'` | How column/row spans are calculated. |
| `patternInterval` | `number` | `5` | When `sizing` is `'pattern'`, photos per repeat cycle. |

**Sizing modes:**
- `'auto'` — Spans are calculated from each photo's aspect ratio. Wide photos get more columns, tall photos get more rows.
- `'pattern'` — A repeating pattern assigns spans in a cycle.
- `'manual'` — You control spans via `photo.meta.colSpan` and `photo.meta.rowSpan`.

**Best for:** Hero sections, featured content grids, and editorial layouts where you want visual variety.

## String Shorthand vs Object Form

Both are equivalent:

```vue
<!-- String shorthand (uses defaults) -->
<PhotoAlbum :photos="photos" layout="rows" />

<!-- Object form (customize options) -->
<PhotoAlbum :photos="photos" :layout="{ type: 'rows' }" />
```

Use the string form when defaults are fine. Use the object form when you need layout-specific options like `targetRowHeight` or `columns`.

## Responsive Layout Options

All numeric layout options accept a `ResponsiveParameter` — either a static value or a function of container width:

```vue
<PhotoAlbum
  :photos="photos"
  :layout="{
    type: 'columns',
    columns: responsive({ 0: 1, 480: 2, 768: 3, 1200: 4 }),
  }"
  :spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
/>
```

See the [Responsive guide](/docs/guides/responsive) for details.

## The AlbumLayout Type

The `layout` prop is typed as a discriminated union — each variant only accepts the options relevant to that layout type:

```ts
type AlbumLayout =
  | { type: 'rows'; targetRowHeight?: ResponsiveParameter<number> }
  | { type: 'columns'; columns?: ResponsiveParameter<number> }
  | { type: 'masonry'; columns?: ResponsiveParameter<number> }
  | {
      type: 'bento'
      columns?: ResponsiveParameter<number>
      rowHeight?: ResponsiveParameter<number>
      sizing?: 'auto' | 'pattern' | 'manual'
      patternInterval?: number
    }
```

This means TypeScript will catch mistakes like passing `targetRowHeight` to a masonry layout.

## Algorithm Deep Dive

Want to know how the Knuth-Plass DP finds optimal row breaks, why it beats Dijkstra + heap, how the column shortest-path works, or what the masonry local search actually does? See the [Layout Algorithms deep dive](/docs/advanced/layout-algorithms).
