---
title: Layout Algorithms
description: Deep dive into the layout algorithms — Knuth-Plass DP, shortest-path column distribution, and greedy masonry with local search.
navigation: true
---

# Layout Algorithms

This page is for the curious. It explains the actual algorithms behind each layout, the trade-offs considered, and why nuxt-photo chose the approaches it did.

## Rows: Knuth-Plass Dynamic Programming

The rows layout solves a classic line-breaking problem: given N photos with varying aspect ratios, find the optimal places to break them into rows such that each row's height is as close to the target as possible.

### The Problem

You have N photos, each with a known aspect ratio. When you place photos side by side in a row, they all share the same height. The wider the photos (in total aspect ratio), the shorter the row. The narrower they are, the taller the row. You want every row to be close to a target height `h`.

Formally: partition photos `[0..N-1]` into consecutive groups (rows) such that the total **cost** is minimized, where the cost of a row is:

```
cost(row) = (actualHeight - targetHeight)² × rowLength
```

The multiplication by `rowLength` penalizes large deviations more when more photos are affected — a row of 6 photos that's 50px too tall is worse than a row of 2 photos that's 50px too tall.

### The Actual Row Height

Given photos in a row, their common height is:

```
commonHeight = usableWidth / Σ(aspectRatio_i)
```

where `usableWidth = containerWidth - (n-1) × spacing - 2 × n × padding` accounts for gaps and padding.

### Why Not Greedy?

A greedy approach (keep adding photos to the current row until it would be too short, then break) produces acceptable results but can't look ahead. Consider: placing one more photo in the current row makes it slightly too short, but that's better than leaving the next row with a single ultra-wide photo that's extremely tall. Greedy can't see this trade-off.

### Why Knuth-Plass over Dijkstra + Heap?

The classic graph-theory approach models this as a shortest-path problem: nodes are break positions `0..N`, and the edge weight from `j` to `i` is the cost of making `photos[j..i-1]` a single row. The optimal layout is the shortest path from node 0 to node N.

You could solve this with Dijkstra's algorithm + a min-heap. But consider:

1. **The graph is a DAG.** Break positions are naturally ordered — you can only go forward. In a DAG, you don't need Dijkstra's relaxation; a simple forward pass works.

2. **No heap overhead.** Dijkstra with a binary heap is O(E log V). For N photos where each row has at most K photos, E = O(N·K) and V = N+1. The heap operations add a log N factor. The DP approach is O(N·K) with no heap, no priority queue, no pointer chasing.

3. **Cache-friendly memory.** The DP uses two typed arrays (`Float64Array` for costs, `Int32Array` for pointers) — contiguous memory, great cache locality. A heap-based approach allocates nodes on the heap and chases pointers.

4. **K is bounded.** The maximum number of photos in a row is `limitNodeSearch = ⌊containerWidth / (targetRowHeight × minAspectRatio)⌋ + 2`. For typical galleries (container ~1200px, target height ~300px, tallest photo ~0.5 aspect ratio), K is around 10. This is what makes O(N·K) essentially O(N).

The DP gives the **globally optimal** solution (same as Dijkstra) but with less constant-factor overhead and better memory behavior. It's the Knuth-Plass line-breaking algorithm adapted for photo galleries instead of text paragraphs.

### The Algorithm

```ts
// dp[i] = minimum total cost for laying out photos[0..i-1]
const minCost = new Float64Array(N + 1).fill(Infinity)
const pointers = new Int32Array(N + 1).fill(0)
minCost[0] = 0

for (let i = 1; i <= N; i++) {
  // Only look back K positions — no row can have more than K photos
  const start = Math.max(0, i - limitNodeSearch)
  for (let j = i - 1; j >= start; j--) {
    const rowCost = cost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
    if (rowCost === undefined) continue

    const totalCost = minCost[j] + rowCost
    if (totalCost < minCost[i]) {
      minCost[i] = totalCost
      pointers[i] = j  // "row ending at i starts at j"
    }
  }
}
```

After the forward pass, `pointers` encodes the optimal break positions. Walk backwards from N to reconstruct the path:

```ts
const path = []
let curr = N
while (curr > 0) {
  path.push(curr)
  curr = pointers[curr]
}
path.push(0)
path.reverse()
// path = [0, 3, 7, 12, N] means rows are photos[0..2], [3..6], [7..11], [12..N-1]
```

### Complexity

| | Time | Space |
|---|---|---|
| Knuth-Plass DP | O(N·K) | O(N) — two typed arrays |
| Dijkstra + heap | O(N·K·log N) | O(N) — but heap-allocated nodes |
| Greedy | O(N) | O(1) |

For 100 photos with K≈10, the DP does ~1,000 iterations. For 1,000 photos, ~10,000. Both are sub-millisecond.

---

## Columns: Shortest-Path Distribution

The columns layout solves a different problem: given N photos and C columns, assign consecutive photos to columns such that column heights are as balanced as possible.

### The Model

This is modeled as a path problem. Given a graph where:
- Node 0 represents the start (before the first photo)
- Node N represents the end (after the last photo)
- An edge from node `j` to node `i` means "photos[j..i-1] form one column"
- Edge weight = `(columnHeight - targetHeight)²`

Finding the shortest path of exactly C edges from 0 to N gives the optimal column assignment.

### Why "Shortest Path of Length C"?

Unlike rows (where the number of rows is variable), columns requires exactly C columns. A regular shortest-path algorithm finds the minimum-weight path of any length. Here we need the minimum-weight path of exactly length C.

### Target Column Height

The ideal column height assumes photos are distributed perfectly evenly:

```ts
const targetColumnHeight = (
  items.reduce((acc, item) => acc + columnWidth / ratio(item), 0)
  + spacing * (N - columns)
  + 2 * padding * N
) / columns
```

### The Graph

Each node is a photo index. The edge from `j` to `i` means "photos[j..i-1] form one column". The weight is the squared deviation from the target column height:

```ts
function getColumnNeighbors(node: number) {
  const results = []
  const cutOffHeight = targetColumnHeight * 1.5
  let height = columnWidth / ratio(items[node]) + 2 * padding

  for (let i = node + 1; i <= N; i++) {
    results.push({
      neighbor: i,
      weight: (targetColumnHeight - height) ** 2,
    })

    if (height > cutOffHeight || i === N) break

    height += columnWidth / ratio(items[i]) + spacing + 2 * padding
  }

  return results
}
```

The 1.5× cutoff prunes edges to columns that are absurdly tall — no need to consider them.

### The Algorithm

The algorithm fills a 2D distance matrix indexed by `(node, pathLength)`. At each step, it extends all known paths by one edge, keeping only the best predecessor at each `(node, length)` cell:

```ts
// matrix[node][length] = { previousNode, accumulatedWeight }
// We need exactly C edges from node 0 to node N

const matrix = new Map()  // node → array of { node, weight } indexed by path length
const queue = new Set([startNode])

for (let length = 0; length < C; length++) {
  const currentQueue = [...queue]
  queue.clear()

  for (const node of currentQueue) {
    const accWeight = length > 0 ? matrix.get(node)?.[length]?.weight ?? 0 : 0

    for (const { neighbor, weight } of getColumnNeighbors(node)) {
      const newWeight = accWeight + weight
      const existing = matrix.get(neighbor)?.[length + 1]

      if (!existing || existing.weight > newWeight) {
        // Record: "best way to reach `neighbor` in `length+1` edges is from `node`"
        matrix.get(neighbor)[length + 1] = { node, weight: newWeight }
      }

      // Keep exploring (unless we've reached the end node or the last step)
      if (length < C - 1 && neighbor !== N) {
        queue.add(neighbor)
      }
    }
  }
}

// Reconstruct: walk backwards through matrix from (N, C) to (0, 0)
const path = [N]
for (let node = N, length = C; length > 0; length--) {
  node = matrix.get(node)[length].node
  path.push(node)
}
path.reverse()
// path = [0, 4, 9, N] means 3 columns: photos[0..3], [4..8], [9..N-1]
```

This is essentially a layer-by-layer BFS through a DAG, where each layer represents one more column. It produces the globally optimal column assignment in O(C·N·K) where K is the max photos per column.

### Why Not Reuse the Rows DP?

The rows DP doesn't constrain the number of groups — it finds the best partition into *any* number of rows. For columns, we need exactly C groups. The fixed-length shortest-path approach handles this naturally by tracking the path length dimension.

---

## Masonry: Greedy + Local Search

The masonry layout uses a two-phase approach.

### Phase 1: Greedy Placement

Classic masonry — iterate through photos in order, place each in the shortest column:

```ts
const columnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
const photoHeights = photos.map(p => columnWidth / (p.width / p.height))

const colItems: number[][] = Array.from({ length: columns }, () => [])
const colHeights: number[] = new Array(columns).fill(0)

for (let i = 0; i < photos.length; i++) {
  // Find the shortest column
  let shortest = 0
  for (let c = 1; c < columns; c++) {
    if (colHeights[c] < colHeights[shortest]) shortest = c
  }
  colItems[shortest].push(i)
  colHeights[shortest] += photoHeights[i] + spacing
}
```

This is O(N·C) and produces a good-but-not-optimal layout. The bottom edge can be jagged.

### Phase 2: Local Search Optimization

After the greedy pass, the algorithm iterates up to 50 times, trying to reduce the height difference between the tallest and shortest columns. Each iteration considers two moves:

1. **Transfer:** Move a photo from the tallest column to the shortest column
2. **Swap:** Exchange a photo between the tallest and shortest columns

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
  if (currentDelta <= 2) break  // close enough

  let bestMove = null
  let bestReduction = 0

  // Try every transfer: move one photo from tallest → shortest
  for (let i = 0; i < colItems[tallest].length; i++) {
    const item = colItems[tallest][i]
    const h = photoHeights[item] + spacing
    // Simulate: what would the new max-min delta be?
    const newTallestH = colHeights[tallest] - h
    const newShortestH = colHeights[shortest] + h
    const newDelta = recomputeMaxMinDelta(newTallestH, newShortestH, colHeights, tallest, shortest)
    const reduction = currentDelta - newDelta
    if (reduction > bestReduction) {
      bestReduction = reduction
      bestMove = { type: 'transfer', idx: item, pos: i }
    }
  }

  // Try every swap: exchange one photo between tallest ↔ shortest
  for (let i = 0; i < colItems[tallest].length; i++) {
    for (let j = 0; j < colItems[shortest].length; j++) {
      const hTall = photoHeights[colItems[tallest][i]] + spacing
      const hShort = photoHeights[colItems[shortest][j]] + spacing
      if (hTall <= hShort) continue  // only swap if it helps
      // Simulate the swap and check the new delta...
      const reduction = currentDelta - newDelta
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestMove = { type: 'swap', tPos: i, sPos: j }
      }
    }
  }

  // Apply the best move (if any)
  if (bestMove) {
    applyMove(bestMove)
    improved = true
  }
}

// After search: re-sort indices within each column to preserve original order
for (let c = 0; c < columns; c++) {
  colItems[c].sort((a, b) => a - b)
}
```

```
Greedy only:     ████████████████████    (tall)
                 ████████████            (short)
                 ███████████████

After local search: ██████████████████
                    █████████████████
                    █████████████████    (balanced)
```

This is a hill-climbing approach — it's not globally optimal, but it's fast (typically converges in 2–5 iterations) and produces visually balanced layouts. Within each column, the original chronological order is preserved by re-sorting indices after the search.

### Why Not Optimal?

An optimal masonry layout (minimizing max column height) is NP-hard — it reduces to the multiprocessor scheduling problem. The greedy + local search is a pragmatic choice: O(N·C) greedy + O(iterations·C²) local search, which is effectively O(N·C) since iterations are bounded.

---

---

## Summary Table

| Layout | Algorithm | Complexity | Optimality | Key property |
|---|---|---|---|---|
| **Rows** | Knuth-Plass DP | O(N·K) | Globally optimal | Every row is close to target height |
| **Columns** | Shortest path (length C) | O(C·N·K) | Globally optimal | Balanced column heights |
| **Masonry** | Greedy + local search | O(N·C) | Approximate | Shortest-column first, then balance |
