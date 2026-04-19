---
title: "Layout Algorithms: A Deep Dive"
description: "The complete guide to every layout algorithm in nuxt-photo — from Knuth-Plass dynamic programming and shortest-path column distribution, to greedy masonry with local search, container query generation, responsive image sizing, and the zero-CLS SSR rendering strategy."
navigation: true
---

# Layout Algorithms: A Deep Dive

This document covers every algorithm that turns a flat array of photos into a pixel-perfect gallery. It's written for developers who want to understand *why* things work the way they do — not just *how* to use the API.

You don't need to read this to use nuxt-photo. But if you're curious about the math behind justified rows, or why the container query system can deduplicate breakpoints, or how the masonry optimizer decides when to stop searching... this is the place.

We'll go in order of the data pipeline — from the raw `PhotoItem[]` array, through layout computation, to the CSS that actually renders on screen.


---


## Chapter 0: The Problem Space

Before diving into any specific algorithm, let's be clear about what we're actually solving.

You have N rectangles. Each has a fixed aspect ratio (width ÷ height) that you can't change — cropping a photo to fit a grid defeats the purpose of a photo gallery. You have a container of some width, and you need to arrange these rectangles into something that looks intentional. No awkward gaps. No photos stretched beyond recognition. A consistent visual rhythm that makes the eye happy.

This isn't a CSS problem. Flexbox can wrap items, and CSS Grid can place them, but neither can solve the *assignment* problem: which photos go together in the same row? How many photos per column? These are combinatorial decisions. The container width changes the answer. The photo aspect ratios change the answer. The spacing and padding change the answer. There's no declarative CSS solution — you need an algorithm.

### The shared abstraction

Every layout algorithm in nuxt-photo follows the same contract:

**Input:** A `PhotoItem[]` array (each item has `id`, `width`, `height`, and `src` at minimum), plus container dimensions and spacing/padding parameters.

**Output:** A `LayoutGroup[]` array, where each group is either a `'row'`, `'column'`, or `'grid'`, and contains `LayoutEntry[]` items — each entry carrying the original photo reference plus computed `width` and `height` in pixels, its position within the group, and how many siblings it has.

```ts
type LayoutEntry = {
  index: number          // position in the original photos array
  photo: PhotoItem       // the original photo
  width: number          // computed pixel width
  height: number         // computed pixel height
  positionIndex: number  // position within this group
  itemsCount: number     // total items in this group
}

type LayoutGroup = {
  type: 'row' | 'column' | 'grid'
  index: number
  entries: LayoutEntry[]
  columnsGaps?: number[]    // columns layout metadata
  columnsRatios?: number[]  // columns layout metadata
}
```

This abstraction is key. The rendering layer (Vue components, CSS) doesn't care which algorithm produced the groups — it just iterates over entries and applies widths and heights. Swap `computeRowsLayout` for `computeColumnsLayout` and the same template works.

### The dimension guard

Before any layout algorithm runs, `validatePhotoDimensions` catches photos with invalid dimensions:

```ts
function validatePhotoDimensions(photos: PhotoItem[]): PhotoItem[] {
  return photos.map((p) => {
    if (p.width > 0 && p.height > 0) return p
    // Dev-only warning
    console.warn(`Photo "${p.id}" has invalid dimensions (${p.width}x${p.height}), using 1:1 fallback`)
    return { ...p, width: 1, height: 1 }
  })
}
```

A photo with `width: 0` or `height: -1` would produce `NaN` in every calculation that divides by height. The 1:1 fallback turns it into a square — not ideal, but the layout won't blow up. The warning only fires in development so production bundles don't log noise.

### A note on rounding

Throughout the layout code, you'll see a custom `round` function:

```ts
function round(value: number, digits = 0) {
  const factor = 10 ** digits
  const preciseValue = value + Number.EPSILON
  return Math.round(preciseValue * factor) / factor
}
```

The `Number.EPSILON` nudge exists because of floating-point arithmetic. Without it, `round(2.005, 2)` returns `2.00` instead of `2.01`. The value `2.005` is actually stored as `2.00499999999999...` in IEEE 754, so `Math.round` rounds down. Adding epsilon (`≈ 2.22e-16`) pushes it past the boundary. These rounded values end up in CSS `calc()` expressions, so a one-pixel error matters.


---


## Chapter 1: Rows — Knuth-Plass Dynamic Programming

The rows layout solves a classic line-breaking problem: given N photos with varying aspect ratios, find the optimal places to break them into rows such that each row's height is as close to the target as possible.

If you've ever wondered how a word processor decides where to wrap text... it's the same problem. Donald Knuth and Michael Plass published the definitive solution in 1981 for TeX's paragraph-breaking algorithm. Nuxt-photo adapts their approach for photo galleries.

### The core problem

You have N photos, each with a known aspect ratio. When you place photos side by side in a row, they all share the same height (that's what makes it "justified"). The wider the photos (in total aspect ratio), the shorter the row. The narrower they are, the taller the row. You want every row to be close to a target height `h`.

Formally: partition photos `[0..N-1]` into consecutive groups (rows) such that the total **cost** is minimized, where the cost of a row is:

```
cost(row) = (actualHeight - targetHeight)² × rowLength
```

The multiplication by `rowLength` penalizes large deviations more when more photos are affected — a row of 6 photos that's 50px too tall is worse than a row of 2 photos that's 50px too tall. This is a deliberate design choice: it biases the algorithm toward distributing deviation across fewer photos rather than spreading small deviations across many.

### Computing a row's actual height

Given a set of photos placed side by side in a row, their common height is determined by how much horizontal space they need to fill:

```
commonHeight = usableWidth / Σ(aspectRatio_i)
```

Where `usableWidth` accounts for gaps and padding:

```
usableWidth = containerWidth - (n-1) × spacing - 2 × n × padding
```

The `(n-1) × spacing` term handles gaps between photos. The `2 × n × padding` term handles padding on both sides of every photo. If you have 4 photos with `spacing: 8` and `padding: 4`, the usable width shrinks by `3 × 8 + 2 × 4 × 4 = 56px`.

Here's the implementation:

```ts
function getCommonHeight(row: PhotoItem[], containerWidth: number, spacing: number, padding: number) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + ratio(item), 0)
  return rowWidth / totalAspectRatio
}
```

When `commonHeight` comes out negative or zero, the row physically can't exist — there's not enough container width left after subtracting all the gaps and padding. The cost function returns `undefined` for these rows, and the DP skips them entirely.

### Why not greedy?

A greedy approach works like this: keep adding photos to the current row until the common height would drop below the target, then start a new row. It's O(N) and produces acceptable results.

But it can't look ahead. Consider this scenario:

```
Photos:  [wide] [wide] [wide] [narrow] [narrow]

Greedy:  Row 1: [wide] [wide] [wide]    ← height 220px (slightly below 280 target)
         Row 2: [narrow] [narrow]        ← height 480px (way too tall!)

Optimal: Row 1: [wide] [wide]           ← height 310px (slightly above target)
         Row 2: [wide] [narrow] [narrow] ← height 260px (slightly below target)
```

The greedy approach crammed three wide photos into the first row because each one still kept the height above target. But that left the second row with only two narrow photos and a massive height. The optimal solution distributes the "pain" more evenly. The DP can see this trade-off because it considers all possible row breaks simultaneously.

### Why Knuth-Plass over Dijkstra + heap?

The row-breaking problem can be modeled as a shortest-path problem on a DAG (directed acyclic graph). Nodes are positions `0..N`, and the edge weight from `j` to `i` is the cost of making `photos[j..i-1]` a single row. The optimal layout is the shortest path from node 0 to node N.

You could solve this with Dijkstra's algorithm and a min-heap. But consider:

**The graph is a DAG.** Break positions are naturally ordered — you can only go forward. In a DAG, you don't need Dijkstra's relaxation step; a simple forward pass in topological order works. And the topological order is just `0, 1, 2, ..., N` — it's free.

**No heap overhead.** Dijkstra with a binary heap is O(E log V). For N photos where each row has at most K photos, E = O(N·K) and V = N+1. The heap operations add a log N factor. The DP approach is O(N·K) with no heap, no priority queue, no pointer chasing.

**Cache-friendly memory.** The DP uses two typed arrays — `Float64Array` for costs and `Int32Array` for back-pointers. These are contiguous memory with great cache locality. A heap-based approach allocates nodes separately and chases pointers, which is murder on modern CPUs where cache misses are the bottleneck.

**K is bounded.** The maximum number of photos in a row is computed by `findIdealNodeSearch`:

```ts
function findIdealNodeSearch(items: PhotoItem[], targetRowHeight: number, containerWidth: number) {
  const minRatio = items.reduce((acc, item) => Math.min(acc, ratio(item)), Number.MAX_VALUE)
  return round(containerWidth / targetRowHeight / minRatio) + 2
}
```

This finds the narrowest photo (smallest aspect ratio), computes how many of them could fit in one row at the target height, and adds a safety margin of 2. For a typical gallery (container ~1200px, target height ~300px, narrowest photo has ~0.5 aspect ratio), K is about 10. This makes O(N·K) essentially O(N).

The `+2` safety margin ensures we don't miss valid configurations. Without it, rounding errors could exclude a row that's technically valid by one photo.

### The DP algorithm

Here's the complete implementation with commentary:

```ts
function findRowBreaks(
  photos: PhotoItem[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const N = photos.length
  if (N === 0) return undefined

  const limitNodeSearch = findIdealNodeSearch(photos, targetRowHeight, containerWidth)

  // dp[i] = minimum total cost for laying out photos[0..i-1]
  const minCost = new Float64Array(N + 1).fill(Infinity)
  const pointers = new Int32Array(N + 1).fill(0)
  minCost[0] = 0  // base case: no photos = no cost

  for (let i = 1; i <= N; i++) {
    // Only look back K positions — no row can have more than K photos
    const start = Math.max(0, i - limitNodeSearch)
    for (let j = i - 1; j >= start; j--) {
      // cost of making photos[j..i-1] a single row
      const currentCost = cost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
      if (currentCost === undefined) continue  // row is physically impossible

      const totalCost = minCost[j] + currentCost
      if (totalCost < minCost[i]) {
        minCost[i] = totalCost
        pointers[i] = j  // "the row ending at position i starts at position j"
      }
    }
  }

  if (minCost[N] === Infinity) return undefined  // no valid layout exists

  // Reconstruct path by walking backwards through pointers
  const path: number[] = []
  let curr = N
  while (curr > 0) {
    path.push(curr)
    curr = pointers[curr]
  }
  path.push(0)
  path.reverse()

  return path
  // Example: [0, 3, 7, 12] means rows are photos[0..2], [3..6], [7..11]
}
```

The forward pass fills two arrays. `minCost[i]` holds the minimum total cost for laying out the first `i` photos. `pointers[i]` records which position starts the last row in the optimal layout ending at `i`.

The inner loop iterates backwards from `i-1` to `start`, trying every possible row start position. For each candidate, it computes the row cost. If `minCost[j] + rowCost` is better than the current best for position `i`, it updates both arrays.

After the forward pass, we reconstruct the optimal row breaks by following back-pointers from N to 0. The result is a path like `[0, 3, 7, 12]`, which means: row 1 contains photos 0–2, row 2 contains photos 3–6, row 3 contains photos 7–11.

### Converting paths to layout groups

The `pathToGroups` function turns the raw break-position path into `LayoutGroup[]` entries with actual pixel dimensions:

```ts
function pathToGroups(path, photos, containerWidth, spacing, padding): LayoutGroup[] {
  const groups = []

  for (let rowIndex = 1; rowIndex < path.length; rowIndex++) {
    const rowItems = photos
      .map((photo, index) => ({ photo, index }))
      .slice(path[rowIndex - 1], path[rowIndex])

    // All photos in the row share this height
    const height = getCommonHeight(
      rowItems.map(({ photo }) => photo),
      containerWidth, spacing, padding,
    )

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries: rowItems.map(({ photo, index }, positionIndex) => ({
        index,
        photo,
        width: height * ratio(photo),  // ← this is the justified magic
        height,
        positionIndex,
        itemsCount: rowItems.length,
      })),
    })
  }

  return groups
}
```

The key line is `width: height * ratio(photo)`. Since all photos in a row share the same height, each photo's width is proportional to its aspect ratio. A 2:1 landscape photo gets twice the width of a 1:1 square. And because the common height was computed to fill the container exactly, all the widths add up to `containerWidth` (minus gaps). That's what makes the rows "justified" — every row fills the full width, just like justified text fills the full column.

### When things go wrong

Several edge cases can cause the DP to produce no result (`undefined`):

**Container too narrow.** If `containerWidth` minus all the gaps leaves no room for photos, every row cost returns `undefined`, and `minCost[N]` stays at `Infinity`.

**Single ultra-tall photo.** A 1:10 portrait in a 1200px container at 300px target height would be 30px wide and 300px tall. It's valid, but it looks terrible. The algorithm doesn't judge aesthetics — it just minimizes cost.

**Empty array.** Returns `undefined` immediately. The rendering layer checks for this and shows nothing.

**Very large arrays (500+ photos).** Still fast — 500 photos × K≈10 = 5,000 iterations. Sub-millisecond on any modern device. The typed arrays (`Float64Array`, `Int32Array`) help because they avoid V8's object overhead and can be optimized by the JIT compiler.

### Complexity

| Approach | Time | Space |
|---|---|---|
| Knuth-Plass DP | O(N·K) | O(N) — two typed arrays |
| Dijkstra + heap | O(N·K·log N) | O(N) — heap-allocated nodes |
| Greedy | O(N) | O(1) |

For typical galleries (N < 100, K ≈ 10), all three are sub-millisecond. The DP wins on quality. The greedy wins on simplicity. Dijkstra is dominated by the DP on every metric for this particular problem structure.


---


## Chapter 2: Container Queries — The Breakpoint System

This is one of the more clever pieces of the codebase, and it solves a problem that most photo gallery libraries ignore: how do you get Knuth-Plass-quality row breaks without re-running the DP on every resize?

### The problem

The rows DP needs a known container width. On the server (SSR), there's no width. On the client, the container width changes during resize, and re-running the DP triggers a full layout recalculation + DOM update. For smooth resize behavior, you'd need to debounce or throttle... but even debounced re-layouts cause visible jank.

### The insight

Row breaks change at specific widths, not on every pixel. Between 900px and 1199px, the same photos might always break into the same rows. Between 1200px and 1599px, a different set of rows. Between 600px and 899px, yet another.

If we pre-compute the row breaks at a set of known breakpoints, we can generate CSS `@container` rules that handle all widths between breakpoints. The browser applies the right rule automatically — no JavaScript needed after the initial computation.

### The deduplication algorithm

The first step is to run the Knuth-Plass DP at every breakpoint:

```ts
const bpEntries = []
for (const bp of sortedBreakpoints) {
  const spacing = resolveResponsiveParameter(opts.spacing, bp, 8)
  const padding = resolveResponsiveParameter(opts.padding, bp, 0)
  const targetRowHeight = resolveResponsiveParameter(opts.targetRowHeight, bp, 300)
  const groups = computeRowsLayout({ photos, containerWidth: bp, spacing, padding, targetRowHeight })
  bpEntries.push({ bp, groups, sig: rowSignature(groups) })
}
```

Note that spacing, padding, and targetRowHeight can all be responsive functions — they might return different values at different breakpoints. The DP is re-run with the resolved values at each width.

The `rowSignature` function creates a string fingerprint of each layout:

```ts
function rowSignature(groups: LayoutGroup[]): string {
  return groups.map(g => g.entries[g.entries.length - 1].index).join(',')
}
```

It takes the ending index of each row and joins them. For example, if the layout has 12 photos in rows `[0-2], [3-6], [7-11]`, the signature is `"2,6,11"`. Two breakpoints with the same signature have the same row assignments — the photos break in the same places.

Adjacent breakpoints with the same signature are collapsed into "spans":

```
Breakpoints: [375, 600, 900, 1200]
Signatures:  ["4,8,11", "2,6,11", "2,6,11", "3,7,11"]
Spans:       [375→375: "4,8,11"], [600→900: "2,6,11"], [1200→1200: "3,7,11"]
```

The 600px and 900px breakpoints produce the same row breaks, so they collapse into a single span.

### Why deduplication is mathematically valid

This is the non-obvious part. The CSS rules use `calc()` expressions for widths:

```css
.np-item-3 {
  width: calc((100% - 24px) / 3.14159);
}
```

The divisor (`3.14159` in this example) equals `(containerWidth - gaps) / photoWidth` — which is the ratio of the total row width to this photo's width. Here's the thing: that ratio only depends on which photos are in the row, not on the container width.

Why? Because in a justified row, every photo's width is proportional to its aspect ratio:

```
photoWidth = commonHeight × ratio(photo)
commonHeight = usableWidth / Σ(ratios in row)
photoWidth = usableWidth × ratio(photo) / Σ(ratios in row)
```

So `usableWidth / photoWidth = Σ(ratios in row) / ratio(photo)`. That's purely a function of which photos are in the row. If two breakpoints produce the same row assignments, the same `calc()` expression handles any width between them correctly. The browser's `calc()` evaluator takes care of the actual container width at render time.

This is the mathematical guarantee that makes the deduplication safe. You're not approximating or interpolating — the CSS formula is exact at every width within the span.

### CSS rule generation

Each span becomes a `@container` rule. The condition depends on the span's position:

```ts
let condition: string
if (spans.length === 1) {
  // Only one span — bare container name, always applies
  condition = containerName
} else if (isFirst) {
  // First span — only max-width
  const nextBp = bpEntries[span.toIdx + 1].bp
  condition = `${containerName} (max-width: ${nextBp - 1}px)`
} else if (isLast) {
  // Last span — only min-width
  const fromBp = bpEntries[span.fromIdx].bp
  condition = `${containerName} (min-width: ${fromBp}px)`
} else {
  // Middle span — both min and max
  const fromBp = bpEntries[span.fromIdx].bp
  const nextBp = bpEntries[span.toIdx + 1].bp
  condition = `${containerName} (min-width: ${fromBp}px) and (max-width: ${nextBp - 1}px)`
}
```

Inside each rule, every photo gets a flex item rule with its computed `calc()` width:

```css
@container np-abc123 (min-width: 600px) and (max-width: 899px) {
  .np-item-0 { flex: 0 0 auto; box-sizing: content-box; overflow: hidden; width: calc((100% - 24px) / 2.84091) }
  .np-item-1 { flex: 0 0 auto; box-sizing: content-box; overflow: hidden; width: calc((100% - 24px) / 5.32011) }
  .np-item-2 { flex: 0 0 auto; box-sizing: content-box; overflow: hidden; width: calc((100% - 24px) / 3.19825) }
}
```

The `containerName` (like `np-abc123`) is derived from Vue's `useId()` with non-alphanumeric characters stripped. This scoping ensures multiple `PhotoAlbum` components on the same page don't conflict.

### The container setup

For container queries to work, the album wrapper needs `container-type: inline-size`:

```ts
const containerStyle = computed(() => {
  if (containerQueriesActive.value) {
    return { width: '100%', containerType: 'inline-size', containerName: containerName.value }
  }
  return { width: '100%' }
})
```

And item elements need the `np-item-{index}` CSS class:

```html
<div
  :class="[containerQueriesActive ? `np-item-${item.index}` : undefined]"
  :style="item.style"
>
```

When both `breakpoints` and `defaultContainerWidth` are provided, the SSR output includes both inline `calc()` styles (from the DP at the assumed width) and the `@container` CSS block (for runtime responsiveness). The container query rules take over after mount, and the inline styles serve as the initial layout to avoid CLS.

### Edge cases

**All breakpoints produce the same layout.** This is common for small photo sets (2–3 photos). The result is a single `@container` rule with a bare container name (no width conditions) — it always applies.

**A breakpoint produces zero groups.** This happens if the container is too narrow for any valid row at that breakpoint. The entry is silently skipped, and the remaining breakpoints still generate rules.

**Non-rows layouts.** Container queries only apply to the rows layout. For columns and masonry, the `containerQueriesActive` flag stays `false` and items get regular inline styles.

**Responsive parameters at breakpoints.** If `spacing` is a function like `(w) => w < 600 ? 4 : 8`, the DP runs with `spacing=4` at the 375px breakpoint and `spacing=8` at the 900px breakpoint. The gap values in the `calc()` expressions are different per rule, reflecting the resolved spacing at each breakpoint's width. This means the deduplication might *not* collapse two breakpoints that would otherwise have the same row breaks — because the gap values differ.


---


## Chapter 3: Columns — Shortest-Path Distribution

The columns layout solves a different problem: given N photos and C columns, assign consecutive photos to columns such that column heights are as balanced as possible.

"Balanced" means minimizing the squared deviation from a target column height. Squared deviation (rather than absolute deviation) penalizes extreme imbalances more than mild ones — one column 200px taller than the rest is worse than all columns being 50px off.

### The model

This is modeled as a shortest-path-of-fixed-length problem. Think of it as:

- **Node 0:** the start (before the first photo)
- **Node N:** the end (after the last photo)
- **An edge from j to i:** "photos[j..i-1] form one column"
- **Edge weight:** `(columnHeight - targetHeight)²`

The optimal column assignment is the shortest path of exactly C edges from 0 to N.

### Why "shortest path of length C"?

A regular shortest-path algorithm finds the minimum-weight path of *any* length. But the columns layout needs exactly C groups. If you have 3 columns, the path must have exactly 3 edges. A 2-edge path (2 columns) or a 5-edge path (5 columns) isn't valid, no matter how low its cost.

The rows layout doesn't have this constraint — the number of rows is whatever the DP decides is optimal. Columns is fundamentally different: the user specifies the column count upfront.

### Computing the target column height

The ideal column height assumes photos are distributed perfectly evenly:

```ts
const targetColumnHeight = (
  items.reduce((acc, item) => acc + targetColumnWidth / ratio(item), 0)
  + spacing * (items.length - columns)
  + 2 * padding * items.length
) / columns
```

The numerator sums up the total height of all photos (at the column width) plus all the vertical spacing. Dividing by the column count gives the height each column would have if photos were distributed perfectly. Obviously they can't be — photos are indivisible — but this target guides the optimization.

### The graph function

The neighbor function generates edges from each node. It builds a list of candidate column endings, stopping when the column would be absurdly tall (1.5× target):

```ts
function getColumnNeighbors(node: number) {
  const results = []
  const cutOffHeight = targetColumnHeight * 1.5
  let height = targetColumnWidth / ratio(items[node]) + 2 * padding

  for (let index = node + 1; index <= N; index++) {
    results.push({
      neighbor: index,
      weight: (targetColumnHeight - height) ** 2,
    })

    if (height > cutOffHeight || index === N) break

    height += targetColumnWidth / ratio(items[index]) + spacing + 2 * padding
  }

  return results
}
```

The 1.5× cutoff is a pruning optimization. Any column more than 50% taller than the target would have an enormous cost. There's no point exploring further — a better split must exist.

### The fixed-length shortest-path algorithm

This is a generic algorithm in `shortestPath.ts`. It builds a 2D distance matrix indexed by `(node, pathLength)`:

```ts
function computeShortestPath(graph, pathLength, startNode, endNode) {
  // matrix[node][length] = { previousNode, accumulatedWeight }
  const matrix = new Map()
  const queue = new Set([startNode])

  for (let length = 0; length < pathLength; length++) {
    const currentQueue = [...queue]
    queue.clear()

    for (const node of currentQueue) {
      const accWeight = length > 0 ? (matrix.get(node)?.[length]?.weight ?? 0) : 0

      for (const { neighbor, weight } of graph(node)) {
        let paths = matrix.get(neighbor)
        if (!paths) {
          paths = []
          matrix.set(neighbor, paths)
        }

        const newWeight = accWeight + weight
        const nextPath = paths[length + 1]

        if (
          nextPath === undefined ||
          (nextPath.weight > newWeight &&
            (nextPath.weight / newWeight > 1.0001 || node < nextPath.node))
        ) {
          paths[length + 1] = { node, weight: newWeight }
        }

        if (length < pathLength - 1 && neighbor !== endNode) {
          queue.add(neighbor)
        }
      }
    }
  }

  return matrix
}
```

Think of it as layer-by-layer BFS through the DAG. Each layer represents one more edge (one more column). At each layer, it extends all known paths by one hop, keeping only the best predecessor at each `(node, pathLength)` cell.

**The tie-breaking rule** deserves attention. The condition `nextPath.weight / newWeight > 1.0001 || node < nextPath.node` has two parts:

1. **The 1.0001 tolerance.** Floating-point equality is unreliable. Two paths with costs `14.9999999` and `15.0000001` should be considered equal. Without the tolerance, tiny rounding differences could cause unstable column assignments — adding one pixel to the container width might completely reshuffle the columns.

2. **The `node < nextPath.node` tie-breaker.** When two paths have effectively equal cost, prefer the one with the smaller split point. This biases toward "fuller first columns," which looks more visually balanced. Without a deterministic tie-breaker, the layout could flicker between equivalent solutions on resize.

### Path reconstruction

After the forward pass, walk backwards from `(endNode, pathLength)` to reconstruct the optimal path:

```ts
function reconstructShortestPath(matrix, pathLength, endNode) {
  const path = [endNode]
  for (let node = endNode, length = pathLength; length > 0; length--) {
    const previousNode = matrix.get(node)?.[length]?.node
    if (previousNode === undefined) break
    node = previousNode
    path.push(node)
  }
  return path.reverse()
}
```

The result is something like `[0, 4, 9, 15]` — 3 columns containing photos `[0-3]`, `[4-8]`, `[9-14]`.

### The few-photos fallback

When the photo count is less than or equal to the column count, the shortest-path algorithm is skipped entirely:

```ts
if (items.length <= columns) {
  const averageRatio = items.length > 0
    ? items.reduce((acc, item) => acc + ratio(item), 0) / items.length
    : 1

  for (let col = 0; col < columns; col++) {
    columnsGaps[col] = 2 * padding
    columnsRatios[col] = col < items.length ? ratio(items[col]) : averageRatio
  }

  const path = Array.from({ length: columns + 1 }, (_, i) => Math.min(i, items.length))
  return { columnsGaps, columnsRatios, columnGroups: buildColumnGroups(path, items) }
}
```

With 2 photos and 3 columns, you get one photo per column (two columns with photos, one empty). Empty columns use the average aspect ratio so they don't collapse to zero width.

### Width calculation with `columnsRatios`

After the path is found, column widths aren't simply `containerWidth / columns`. They're proportional to each column's total aspect ratio. This is what makes the layout visually balanced — a column full of tall portraits gets more width than a column full of wide landscapes:

```ts
const totalRatio = columnsRatios.reduce((acc, r) => acc + r, 0)

const columnWidth = (
  (containerWidth - (columnsCount - 1) * spacing - 2 * columnsCount * padding - totalAdjustedGaps)
  * columnsRatios[col]
) / totalRatio
```

The `columnsGaps` and `columnsRatios` arrays are passed through to the CSS rendering layer as metadata on the `LayoutGroup`. This lets the template express column widths as `calc()` percentages that respond to container width — similar to the rows approach.

### The recursive fallback

If any column's computed width comes out negative (which can happen with extreme spacing/padding relative to a narrow container), the algorithm retries with one fewer column:

```ts
if (entries.some(e => e.width <= 0 || e.height <= 0)) {
  if (columns > 1) {
    return computeColumnsLayout({ ...options, columns: columns - 1 })
  }
  return []
}
```

This is graceful degradation. On a 300px-wide mobile screen with `spacing: 16` and `columns: 5`, the gaps alone consume 64px — that's 21% of the container. The algorithm will keep reducing columns until the layout fits. If even 1 column doesn't work, it returns an empty array.

### Complexity

The fixed-length shortest path runs in O(C·N·K) where C is columns, N is photos, and K is the maximum photos per column (bounded by the 1.5× cutoff). For typical values (C=3, N=100, K≈30), that's ~9,000 iterations — well under a millisecond.


---


## Chapter 4: Masonry — Greedy Assignment + Local Search

The masonry layout places photos into equal-width columns, preserving chronological order within each column. Unlike the columns layout, photos within a column *don't* share a width with photos in other columns — every column is the same width, and each photo's height is determined by its aspect ratio.

The challenge is distributing photos across columns to make the bottom edge as even as possible.

### Phase 1: greedy placement

The first pass is the classic masonry approach — place each photo in the shortest column:

```ts
const columnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
const photoHeights = photos.map(p => columnWidth / (p.width / p.height))

const colItems: number[][] = Array.from({ length: columns }, () => [])
const colHeights: number[] = new Array(columns).fill(0)

for (let i = 0; i < photos.length; i++) {
  let shortest = 0
  for (let c = 1; c < columns; c++) {
    if (colHeights[c] < colHeights[shortest]) shortest = c
  }
  colItems[shortest].push(i)
  colHeights[shortest] += photoHeights[i] + spacing
}
```

This is O(N·C) and produces a good starting point. But the bottom edge is usually jagged — the last few placements can leave one column much taller than the others.

### Phase 2: local search optimization

After the greedy pass, the algorithm tries to reduce the height difference between the tallest and shortest columns. It runs up to 50 iterations, each time considering two types of moves:

**Transfer:** Move a photo from the tallest column to the shortest column.

**Swap:** Exchange a photo between the tallest and shortest columns (only when the tallest column's photo is taller than the shortest column's photo — otherwise the swap would make things worse).

Each iteration finds the single best move (the one that reduces the max-min delta the most) and applies it:

```ts
let improved = true
let iterations = 0

while (improved && iterations < 50) {
  improved = false
  iterations++

  // Find tallest and shortest columns
  let tallest = 0, shortest = 0
  for (let c = 1; c < columns; c++) {
    if (colHeights[c] > colHeights[tallest]) tallest = c
    if (colHeights[c] < colHeights[shortest]) shortest = c
  }

  const currentDelta = colHeights[tallest] - colHeights[shortest]
  if (currentDelta <= 2) break  // close enough — 2px is invisible

  let bestMove = null
  let bestReduction = 0

  // Try every possible transfer
  for (let i = 0; i < colItems[tallest].length; i++) {
    const item = colItems[tallest][i]
    const h = photoHeights[item] + spacing
    const newTH = colHeights[tallest] - h
    const newSH = colHeights[shortest] + h

    // Recompute global max and min across ALL columns
    let newMax = newTH, newMin = newSH
    for (let c = 0; c < columns; c++) {
      if (c === tallest || c === shortest) continue
      if (colHeights[c] > newMax) newMax = colHeights[c]
      if (colHeights[c] < newMin) newMin = colHeights[c]
    }

    const reduction = currentDelta - (newMax - newMin)
    if (reduction > bestReduction) {
      bestReduction = reduction
      bestMove = { type: 'transfer', idx: item, pos: i }
    }
  }

  // Try every possible swap
  for (let i = 0; i < colItems[tallest].length; i++) {
    for (let j = 0; j < colItems[shortest].length; j++) {
      const hT = photoHeights[colItems[tallest][i]] + spacing
      const hS = photoHeights[colItems[shortest][j]] + spacing
      if (hT <= hS) continue  // swap would make things worse

      const newTH = colHeights[tallest] - hT + hS
      const newSH = colHeights[shortest] - hS + hT
      // ... same max/min recomputation ...
      const reduction = currentDelta - (newMax - newMin)
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestMove = { type: 'swap', tPos: i, sPos: j }
      }
    }
  }

  if (bestMove) {
    // Apply the best move
    improved = true
  }
}
```

### The optimization target

The local search minimizes `max(colHeights) - min(colHeights)` — the max-min delta. This is different from minimizing `max(colHeights)` (makespan). Consider three columns with heights `[800, 780, 790]` vs `[750, 750, 810]`:

- Delta: 20 vs 60 → first layout wins
- Makespan: 800 vs 810 → first layout wins

In this case they agree. But consider `[810, 800, 790]` vs `[795, 795, 810]`:

- Delta: 20 vs 15 → second layout wins
- Makespan: 810 vs 810 → tie

Minimizing the delta produces the most visually balanced bottom edge, which is what matters for a gallery. The tallest column determines the gallery height in both cases, but a flat bottom edge *looks* more intentional.

### Why 50 iterations?

Empirically, convergence happens in 2–8 iterations for typical galleries (12–50 photos, 2–4 columns). The `currentDelta <= 2` early exit handles the common case where the columns are already balanced within a pixel or two. The 50-iteration cap is a safety net for pathological inputs (e.g., 200 photos where most are extreme aspect ratios).

### Order preservation

The local search can break chronological order within columns. A transfer moves a photo to the end of the target column. A swap changes positions within both columns. After the search completes, indices within each column are re-sorted:

```ts
for (let c = 0; c < columns; c++) {
  colItems[c].sort((a, b) => a - b)
}
```

This means the optimization treats each column as an unordered bag of heights, optimizes for balance, then restores the original order. It's a simplification — position-aware moves could theoretically produce better results — but the quality loss is negligible in practice because the optimization only moves photos between the tallest and shortest columns, and the re-sorting step is O(N log N) in the worst case.

### Relationship to bin packing

The masonry problem is a variant of the multiprocessor scheduling problem (identical machines, minimize makespan). The greedy phase is essentially the LPT (Longest Processing Time first) heuristic running on unsorted input. Classic LPT sorts items by decreasing size first, which gives a 4/3-OPT approximation. Nuxt-photo doesn't sort because it needs to preserve photo order. The local search typically closes the gap between the unsorted greedy and the sorted LPT quality.

The optimal solution (minimizing max column height) is NP-hard — it reduces to the number partitioning problem. The greedy + local search is a pragmatic choice: fast enough to run on every resize, good enough that you can't see the difference from optimal.

```
Before optimization:    After optimization:

████████████████████    ██████████████████
████████████            ███████████████████
███████████████         █████████████████

  delta = 162px           delta = 4px
```

### Complexity

| Phase | Time |
|---|---|
| Greedy placement | O(N·C) |
| Local search (per iteration) | O(C² · max photos per column) |
| Order restoration | O(N log N) worst case |
| Total | O(N·C) — iterations are bounded at 50 |


---


## Chapter 6: The `computePhotoSizes` Algorithm

This function generates the `<img sizes>` attribute for responsive image loading in the rows layout. Browsers need a `sizes` attribute to choose the right source from a `srcset` *before layout is complete* — before the browser knows the actual rendered width of the image. The `sizes` attribute tells it "this image will be about this wide."

### The problem

For a justified-rows layout, each photo's rendered width depends on:
1. The container width (unknown during image preloading)
2. Which other photos are in the same row (determined by the Knuth-Plass DP, which needs a container width)
3. The spacing and padding values

You can't give the browser a static `sizes` value because the width is dynamic.

### The formula

The solution uses a CSS `calc()` expression that mirrors the layout math:

```ts
function computePhotoSizes(
  photoWidth: number,
  containerWidth: number,
  itemsInRow: number,
  spacing: number,
  padding: number,
  responsiveSizes?: { size: string; sizes?: Array<{ viewport: string; size: string }> },
): string | undefined {
  if (!responsiveSizes) return undefined

  const gaps = spacing * (itemsInRow - 1) + 2 * padding * itemsInRow
  const divisor = round((containerWidth - gaps) / photoWidth, 5)
  const defaultSize = `calc((${responsiveSizes.size} - ${gaps}px) / ${divisor})`

  if (!responsiveSizes.sizes?.length) return defaultSize

  const parts = responsiveSizes.sizes.map(({ viewport, size }) => `${viewport} ${size}`)
  parts.push(defaultSize)
  return parts.join(', ')
}
```

The `divisor` is `(containerWidth - gaps) / photoWidth`, which equals the ratio of the total row usable width to this photo's width. Like the container query system, this ratio is independent of the actual container width at render time — it only depends on which photos are in the row.

So the `calc()` expression `calc((100vw - 24px) / 3.14)` means "take the container size, subtract the gaps, and divide by the same ratio." This gives the browser an accurate size estimate at any viewport width.

### Viewport-specific overrides

The `responsiveSizes.sizes` array adds viewport-specific entries that are prepended to the `sizes` attribute:

```ts
// Input
responsiveSizes = {
  size: '100vw',
  sizes: [
    { viewport: '(max-width: 600px)', size: '100vw' },
    { viewport: '(max-width: 900px)', size: '50vw' },
  ]
}

// Output
'(max-width: 600px) 100vw, (max-width: 900px) 50vw, calc((100vw - 24px) / 3.14)'
```

The browser evaluates left to right and uses the first match. On a 500px screen, it matches the first entry (`100vw`). On an 800px screen, it matches the second (`50vw`). On anything wider, it falls through to the `calc()` default.

### Why `undefined` when `responsiveSizes` is not provided

The function returns `undefined` — not an empty string, not a default value. This lets callers use `undefined` as a signal to fall through to the image adapter's own `sizes` computation:

```html
<img
  :sizes="props.sizes ?? resolved.sizes"
/>
```

The `??` operator means "use the layout-computed sizes if available, otherwise use whatever the image adapter computed." This clean fallback pattern avoids double-computing sizes.


---


## Chapter 7: The Responsive Parameter System

Most layout parameters in nuxt-photo — spacing, padding, columns, target row height — can be either a static value or a function of the container width. This is the system that makes that work.

### The `responsive()` helper

Takes a breakpoint map and returns a function:

```ts
function responsive<T>(breakpoints: Record<number, T>): (containerWidth: number) => T {
  const sorted = Object.entries(breakpoints)
    .map(([k, v]) => [Number(k), v] as [number, T])
    .sort((a, b) => b[0] - a[0])  // descending by breakpoint

  if (sorted.length === 0) {
    throw new Error('[nuxt-photo] responsive() requires at least one breakpoint')
  }

  return (containerWidth: number) => {
    for (const [minWidth, value] of sorted) {
      if (containerWidth >= minWidth) return value
    }
    return sorted[sorted.length - 1]![1]  // smallest breakpoint's value
  }
}
```

Usage:

```ts
// 2 columns below 600px, 3 at 600-899px, 4 at 900px+
const columns = responsive({ 0: 2, 600: 3, 900: 4 })

columns(400)  // → 2
columns(750)  // → 3
columns(1200) // → 4
```

The sort is descending so the linear scan finds the *largest* matching breakpoint first. For a typical 3–5 breakpoint map, the scan is O(B) per call where B is tiny. There's no binary search because the overhead of binary search setup exceeds the savings for B < 10.

The fallback at the bottom (`sorted[sorted.length - 1]`) handles widths below the smallest breakpoint. If you define `{ 400: 'small', 800: 'large' }` and the container is 200px wide, you still get `'small'`. This prevents gaps in the breakpoint coverage.

### The `resolveResponsiveParameter` function

The three-way dispatch that glues responsive values into the layout engine:

```ts
function resolveResponsiveParameter<T>(
  value: ResponsiveParameter<T> | undefined,
  containerWidth: number,
  fallback: T,
): T {
  if (value === undefined) return fallback
  return typeof value === 'function' ? (value as (w: number) => T)(containerWidth) : value
}
```

Three cases:

| Input | Result |
|---|---|
| `undefined` | `fallback` (the default value) |
| A function `(w) => ...` | Call it with the container width |
| A plain value | Return it directly |

This is the polymorphic glue. Every layout option flows through `resolveResponsiveParameter` before reaching the algorithm. The spacing might be `8`, or it might be `(w) => w < 600 ? 4 : 8`, or it might be `responsive({ 0: 4, 600: 8, 900: 12 })`. The layout algorithm doesn't know or care — it just gets a resolved number.

### Interaction with container queries

When the container query system is active, every responsive parameter is resolved at *every breakpoint* independently. This means the DP might run with `spacing=4` at 375px and `spacing=8` at 900px. The resulting CSS rules have different gap values in their `calc()` expressions, and the deduplication correctly treats these as different layouts even if the row breaks happen to be the same.


---


## Chapter 8: The SSR Rendering Strategy

Server-side rendering a photo gallery is tricky. The server doesn't know the container width, so it can't run the layout algorithms. But if you render nothing and wait for the client to measure + compute, the gallery pops in after hydration... Cumulative Layout Shift (CLS).

Nuxt-photo solves this with a two-path strategy for the rows layout, plus CSS Grid fallbacks for the other layouts.

### Path 1: CSS flex-grow approximation (no `defaultContainerWidth`)

When no assumed width is provided, the server renders each photo as a flex item with `flex-grow` proportional to its aspect ratio:

```ts
// SSR output for each photo
style = {
  flexGrow: aspectRatio,
  flexBasis: `${targetRowHeight * aspectRatio}px`,
  overflow: 'hidden',
}
```

The wrapping container is a CSS flexbox with `flex-wrap: wrap`. The browser flows photos into rows based on the flex-basis values. This isn't Knuth-Plass-optimal — the browser's flex algorithm doesn't minimize a cost function — but it produces reasonable rows because `flex-basis` approximates each photo's ideal width at the target row height.

The key property: **the DOM structure never changes.** On SSR, each photo is a `<div>` in a flex wrapper. After hydration, those same `<div>` elements get `calc()` widths from the DP. No elements are added, removed, or moved. This means the only layout shift is a subtle width adjustment — typically a few pixels per photo. That's well below the CLS threshold.

The `<img>` elements inside each item have `aspect-ratio` set:

```html
<img style="aspect-ratio: 1600 / 1000; width: 100%; height: auto;" />
```

This ensures the images maintain their aspect ratio during the flex-to-DP transition, even before the images load. No height collapse, no reflow.

### Path 2: JS layout on server (with `defaultContainerWidth`)

When an assumed width is provided (e.g., `defaultContainerWidth: 1200`), the full Knuth-Plass DP runs on the server:

```ts
if (containerWidth.value > 0 && groups.value.length > 0) {
  // JS layout with calc() widths
  return groups.value.flatMap(row =>
    row.entries.map((entry) => ({
      style: {
        flex: '0 0 auto',
        width: `calc((100% - ${gaps}px) / ${divisor})`,
      },
    }))
  )
}
```

The SSR output has exact `calc()` widths from the start. If the assumed width matches the real container width, there's zero CLS — the layout is pixel-perfect from the first paint.

If the assumed width *doesn't* match (e.g., you assumed 1200px but the user's container is 900px), there's a one-time reflow after hydration when the `ResizeObserver` picks up the real width and the DP re-runs. This is still better than rendering nothing.

When both `defaultContainerWidth` and `breakpoints` are provided, you get the best of both worlds: exact widths for the server-rendered state *and* container query rules for responsive runtime behavior. The container queries take over after mount.

### The filler span

Both paths include a filler element at the end of the flex container:

```html
<span style="flex-grow: 9999; flex-basis: 0; height: 0; margin: 0; padding: 0;" aria-hidden="true" />
```

This is the "last-row fix." Without it, the final row's photos stretch to fill the container width. If the last row has 2 photos that should fill 60% of the width, flex-grow makes them fill 100% — they look bloated.

The filler span has `flex-grow: 9999`, which dominates the flex distribution. It absorbs all remaining space, keeping the last row's photos at their natural width. The `height: 0` and `aria-hidden` ensure it's invisible and not announced to screen readers.

### SSR for non-rows layouts

For columns and masonry, the server renders a CSS Grid fallback:

```ts
ssrWrapperStyle = {
  display: 'grid',
  gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap: `${spacing}px`,
  width: '100%',
}
```

This gives each photo an equal-width column. It's not the same as the computed layout (which uses shortest-path distribution for columns, or greedy+local-search for masonry), but it's a reasonable approximation. After hydration, the `isMounted` flag flips, and the component switches to the JS-computed layout groups.

### The `useContainerWidth` composable

The width tracking mechanism deserves mention. It wraps `ResizeObserver` with two features:

**Breakpoint snapping.** If breakpoints are configured, the observed width is snapped down to the largest breakpoint ≤ actual width. This prevents re-layout on sub-pixel fluctuations. A 901px → 899px → 901px resize oscillation (common with scrollbar appearance/disappearance) would cause the DP to run three times without snapping. With snapping (breakpoints at 600, 900), all three observations snap to 900px — one layout computation.

**Scrollbar oscillation detection.** When a layout change causes a scrollbar to appear (or disappear), the container width changes by the scrollbar width (~15–20px). This can trigger another layout change, which might cause the scrollbar to disappear, bouncing back to the original width. The composable detects this pattern:

```ts
// Scrollbar oscillation: width bounces back to prevWidth within MAX_SCROLLBAR_WIDTH
if (newW === prevWidth && Math.abs(newW - containerWidth.value) <= MAX_SCROLLBAR_WIDTH) {
  containerWidth.value = Math.min(containerWidth.value, newW)
  return
}
```

It takes the *smaller* of the two widths, which stabilizes the layout. The scrollbar stays visible, and the content fits within the remaining space.


---


## Chapter 9: The Image Load Cache

The `ensureImageLoaded` function is used during lightbox transitions — it preloads the full-resolution image before showing it. But calling `new Image()` and waiting for `onload` every time would re-download images that are already in the browser cache. So there's an in-memory cache:

```ts
const MAX_CACHE_SIZE = 500
const imageLoadCache = new Map<string, Promise<void>>()

function ensureImageLoaded(src: string): Promise<void> {
  const cached = imageLoadCache.get(src)
  if (cached) return cached

  const promise = new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => resolve()
    image.onerror = () => resolve()  // resolve on error too — don't block the UI
    image.src = src

    if (image.decode) {
      image.decode().catch(() => {}).finally(resolve)
      return
    }

    if (image.complete) {
      resolve()
    }
  })

  imageLoadCache.set(src, promise)

  // LRU eviction: remove the oldest entry when the cache is full
  if (imageLoadCache.size > MAX_CACHE_SIZE) {
    imageLoadCache.delete(imageLoadCache.keys().next().value!)
  }

  return promise
}
```

Key design decisions:

**Resolve on error.** If an image fails to load, the lightbox should still open — it'll show a broken image, but that's better than hanging. The `onerror` handler resolves (not rejects) the promise.

**`image.decode()` when available.** The `decode()` API tells the browser to decode the image off the main thread before resolving. This prevents jank when a large JPEG is first displayed — the decoding happens in the background, and the image is ready to paint when the promise resolves.

**`image.complete` check.** If the image is already in the browser's cache, `image.complete` is `true` immediately after setting `src`. No need to wait for `onload`.

**LRU eviction at 500 entries.** `Map` preserves insertion order, so `keys().next().value` gives the oldest entry. 500 is generous for a photo gallery — most users won't view 500 unique images in one session. The eviction prevents unbounded memory growth in apps with dynamic photo sets.


---


## Chapter 10: The Physics Engine

The layout algorithms produce static dimensions, but the lightbox needs *motion* — spring-animated zoom, inertial pan, drag-to-close with rubberband resistance. This chapter covers the physics primitives.

### Spring model

The spring system uses a standard tension-friction model. At each timestep:

```ts
function springStep(current, target, velocity, tension, friction, dt) {
  const distance = target - current
  const newVelocity = velocity + (distance * tension - velocity * friction) * dt
  return { value: current + newVelocity * dt, velocity: newVelocity }
}
```

- `tension` controls the spring stiffness — higher values make it snap faster. Default: 260.
- `friction` controls the damping — higher values make it settle faster. Default: 22.
- `dt` is the time delta in seconds, capped at 0.064 (about 16fps) to prevent explosion after a tab-sleep.

The spring runs on `requestAnimationFrame` and stops when both the position error and velocity drop below thresholds:

```ts
const distance = Math.abs(spring.target - spring.value)
const done = distance < positionThreshold && Math.abs(spring.velocity) < velocityThreshold
```

Default thresholds: position < 0.5px, velocity < 0.1px/frame. These are tuned so the spring stops before sub-pixel oscillation becomes visible.

### Panzoom motion

The panzoom system (used for zoom and pan in the lightbox) extends the spring to three axes simultaneously: x, y, and scale. Instead of three separate springs, it uses a single animation loop with a shared `PanzoomMotion` struct:

```ts
type PanzoomMotion = {
  x: number; y: number; scale: number
  targetX: number; targetY: number; targetScale: number
  velocityX: number; velocityY: number; velocityScale: number
  tension: number; friction: number
  rafId: number
}
```

One `requestAnimationFrame` loop applies the spring equation to all three axes:

```ts
panzoomMotion.velocityScale += (scaleDistance * spring - panzoomMotion.velocityScale * damping) * dt
panzoomMotion.velocityX += (xDistance * spring - panzoomMotion.velocityX * damping) * dt
panzoomMotion.velocityY += (yDistance * spring - panzoomMotion.velocityY * damping) * dt
```

The transform is applied directly to the DOM element — no reactive state update per frame:

```ts
element.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`
```

This is critical for performance. Updating a Vue `ref` on every animation frame would trigger reactivity, diff computation, and potential re-renders. Direct DOM manipulation bypasses all of that. The reactive `zoomState` and `panState` refs are only synced when the spring settles.

### Velocity tracking

The `VelocityTracker` records pointer position samples in a ring buffer and computes velocity over a sliding window:

```ts
class VelocityTracker {
  private readonly buffer: (Sample | undefined)[] = new Array(32)
  private head = 0
  private count = 0
  private readonly windowMs: number  // default: 100ms

  addSample(x, y, time) {
    this.buffer[this.head] = { x, y, time }
    this.head = (this.head + 1) % 32
    if (this.count < 32) this.count++
  }

  getVelocity(): { vx: number; vy: number } {
    // Find oldest sample still within windowMs
    // Return (newest - oldest) / elapsed
  }
}
```

The 100ms window means velocity is computed from the most recent ~6 pointer samples (at 60fps). Shorter windows are noisier; longer windows lag behind sudden direction changes. 100ms is a sweet spot for gesture recognition.

The ring buffer with capacity 32 avoids memory allocation. `addSample` overwrites the oldest entry when full. `getVelocity` scans from oldest to newest to find the window boundary.

### Rubberband

When you drag beyond the pan bounds (at the edge of a zoomed-in photo), the content should feel "elastic" — it moves, but with resistance. The `rubberband` function provides this:

```ts
function rubberband(value: number, min: number, max: number): number {
  if (value < min) return min + (value - min) * 0.2
  if (value > max) return max + (value - max) * 0.2
  return value
}
```

Within bounds, the value passes through unchanged. Beyond bounds, only 20% of the overflow is applied. Dragging 100px past the edge moves the content only 20px. This gives the "rubber band" feel familiar from iOS scroll views.

### Easing functions

Two easing functions are used for non-spring animations (transitions, opacity fades):

```ts
function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - ((-2 * t + 2) ** 3) / 2
}
```

`easeOutCubic` starts fast and decelerates — used for fade-close transitions where you want the content to disappear quickly then settle. `easeInOutCubic` is symmetric — used for the number animation utility (`animateNumber`) which interpolates between values over a fixed duration.


---


## Chapter 11: Gesture Classification

The gesture system needs to decide — from the first 10-15 pixels of pointer movement — whether the user intends to swipe between slides, pan a zoomed image, or drag-to-close. Getting this wrong is deeply frustrating: you try to swipe to the next photo but the lightbox closes instead.

### The classifier

```ts
function classifyGesture(
  deltaX: number,
  deltaY: number,
  pointerType: string,
  isZoomedIn: boolean,
  panBounds: { x: number; y: number },
  currentPan: PanState,
): GestureMode {
  const absX = Math.abs(deltaX)
  const absY = Math.abs(deltaY)
  const threshold = pointerType === 'touch' ? 10 : 6

  if (absX < threshold && absY < threshold) return 'idle'

  const horizontalIntent = absX > absY * 1.1
  const verticalIntent = absY > absX * 1.1

  if (isZoomedIn) {
    const canPanX = panBounds.x > 0.5
    const canPanY = panBounds.y > 0.5
    const atLeftEdge = currentPan.x >= panBounds.x - 1
    const atRightEdge = currentPan.x <= -panBounds.x + 1

    const wantsOutwardSlide = horizontalIntent
      && (!canPanX || (deltaX > 0 && atLeftEdge) || (deltaX < 0 && atRightEdge))

    if (!wantsOutwardSlide && (canPanX || canPanY)) return 'pan'
    if (horizontalIntent) return 'slide'
    return 'pan'
  }

  if (horizontalIntent) return 'slide'
  if (verticalIntent) return 'close'
  return absX >= absY ? 'slide' : 'close'
}
```

Key decisions:

**Different thresholds for touch vs mouse.** Touch input is inherently imprecise — fingers are fat, screens shake. A 10px dead zone prevents accidental classifications. Mice are precise, so 6px is enough.

**The 1.1× multiplier.** `absX > absY * 1.1` (not `absX > absY`) requires a clear directional bias before committing. A 45-degree diagonal drag stays `idle` until more data arrives. This prevents misclassification on ambiguous gestures.

**Zoomed-in edge detection.** When zoomed in, horizontal swipes at the pan edge should slide to the next photo — not pan further (there's nothing to pan to). The `atLeftEdge` / `atRightEdge` checks detect when the pan has hit its bounds. At that point, a horizontal gesture becomes `'slide'` instead of `'pan'`.

**The close drag ratio.** Once classified as `'close'`, the drag distance is converted to a ratio for the backdrop opacity:

```ts
function computeCloseDragRatio(closeDragY: number, areaHeight: number): number {
  return Math.min(0.75, Math.abs(closeDragY) / Math.max(240, areaHeight * 0.85))
}
```

The `Math.max(240, areaHeight * 0.85)` denominator means you need to drag at least 240px (or 85% of the viewport, whichever is larger) to reach the maximum dimming. The 0.75 cap means the backdrop never fully disappears during a drag — there's always a hint that you're still in the lightbox.


---


## Chapter 12: Performance Characteristics

Here's how the algorithms scale with real inputs.

### Layout computation

All measurements are rough estimates for a modern device (M1 Mac, Chrome):

| N photos | Rows (K≈10) | Columns (C=3) | Masonry (C=3) |
|---|---|---|---|
| 12 | < 0.05ms | < 0.05ms | < 0.05ms |
| 50 | ~0.1ms | ~0.2ms | ~0.1ms |
| 100 | ~0.2ms | ~0.5ms | ~0.2ms |
| 500 | ~1ms | ~3ms | ~1ms |
| 1,000 | ~2ms | ~8ms | ~3ms |

Container query generation for 4 breakpoints: approximately 4× the rows cost (since the DP runs at each breakpoint). The deduplication and CSS string building add negligible overhead.

### Memory

| Algorithm | Allocation |
|---|---|
| Rows DP | Two typed arrays of size N+1 (< 16KB for 1000 photos) |
| Columns shortest-path | A `Map<number, Array>` — sparse, typically < 50KB |
| Masonry | Two arrays of size C, one array of size N (< 16KB for 1000 photos) |

None of these are worth worrying about. A single high-res JPEG is 2–10MB.

### Resize behavior

Without breakpoints: the layout recomputes on every `ResizeObserver` callback (debounced by the browser, typically ~60fps). This is fine for N < 100. For larger galleries, the breakpoint system is recommended — it snaps widths and eliminates intermediate computations.

With breakpoints: the layout only recomputes when the width crosses a breakpoint boundary. Between breakpoints, the CSS `@container` rules handle everything — zero JavaScript.


---


## Summary

| Chapter | Algorithm | Complexity | Optimality |
|---|---|---|---|
| **Rows** | Knuth-Plass DP | O(N·K) | Globally optimal |
| **Container queries** | Breakpoint deduplication | O(B·N·K) | Exact — CSS calc() is container-width-independent |
| **Columns** | Shortest path (length C) | O(C·N·K) | Globally optimal |
| **Masonry** | Greedy + local search | O(N·C) | Approximate (NP-hard optimal) |
| **Photo sizes** | Calc() divisor computation | O(1) per photo | Exact |
| **Responsive params** | Linear scan of sorted breakpoints | O(B) per resolution | Exact |
| **SSR strategy** | Flex-grow approximation or server-side DP | O(N·K) or O(1) | Approximate (flex) or exact (DP) |
| **Image cache** | Map with LRU eviction | O(1) amortized | N/A |
| **Physics** | Tension-friction spring integration | O(frames) per animation | N/A |
| **Gestures** | Threshold + directional classifier | O(1) per event | N/A |

Each algorithm was chosen for a specific reason. Knuth-Plass because it's optimal and O(N). Shortest-path-of-length-C because columns need a fixed group count. Greedy+local-search because optimal masonry is NP-hard.

The common thread is pragmatism — globally optimal where it's tractable, good-enough heuristics where it isn't, and always fast enough to run in a `ResizeObserver` callback.
