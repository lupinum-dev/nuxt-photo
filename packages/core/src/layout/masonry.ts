import type { LayoutEntry, LayoutGroup, LayoutItem, MasonryLayoutOptions } from '../types'

/**
 * Grouped masonry layout — returns LayoutGroup[] for flexbox rendering.
 * Equal-width columns with greedy shortest-column assignment + local search optimization.
 */
export function computeMasonryGroupedLayout(options: MasonryLayoutOptions): LayoutGroup[] {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return []

  const columnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
  const photoHeights = photos.map(p => columnWidth / (p.width / p.height))

  // Greedy assignment + optimization (reuse existing logic)
  const colItems: number[][] = Array.from({ length: columns }, () => [])
  const colHeights: number[] = new Array(columns).fill(0)

  for (let i = 0; i < photos.length; i++) {
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    colItems[shortest]!.push(i)
    colHeights[shortest]! += photoHeights[i]! + spacing
  }

  // Local search optimization (same as flat version)
  let improved = true
  let iterations = 0
  while (improved && iterations < 50) {
    improved = false
    iterations++
    let tallest = 0
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! > colHeights[tallest]!) tallest = c
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    const currentDelta = colHeights[tallest]! - colHeights[shortest]!
    if (currentDelta <= 2) break

    let bestMove: { type: 'transfer'; idx: number; pos: number } | { type: 'swap'; tPos: number; sPos: number } | null = null
    let bestReduction = 0

    for (let i = 0; i < colItems[tallest]!.length; i++) {
      const item = colItems[tallest]![i]!
      const h = photoHeights[item]! + spacing
      const newTH = colHeights[tallest]! - h
      const newSH = colHeights[shortest]! + h
      let newMax = newTH
      let newMin = newSH
      for (let c = 0; c < columns; c++) {
        if (c === tallest || c === shortest) continue
        if (colHeights[c]! > newMax) newMax = colHeights[c]!
        if (colHeights[c]! < newMin) newMin = colHeights[c]!
      }
      const reduction = currentDelta - (newMax - newMin)
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestMove = { type: 'transfer', idx: item, pos: i }
      }
    }

    for (let i = 0; i < colItems[tallest]!.length; i++) {
      for (let j = 0; j < colItems[shortest]!.length; j++) {
        const itemT = colItems[tallest]![i]!
        const itemS = colItems[shortest]![j]!
        const hT = photoHeights[itemT]! + spacing
        const hS = photoHeights[itemS]! + spacing
        if (hT <= hS) continue
        const newTH = colHeights[tallest]! - hT + hS
        const newSH = colHeights[shortest]! - hS + hT
        let newMax = Math.max(newTH, newSH)
        let newMin = Math.min(newTH, newSH)
        for (let c = 0; c < columns; c++) {
          if (c === tallest || c === shortest) continue
          if (colHeights[c]! > newMax) newMax = colHeights[c]!
          if (colHeights[c]! < newMin) newMin = colHeights[c]!
        }
        const reduction = currentDelta - (newMax - newMin)
        if (reduction > bestReduction) {
          bestReduction = reduction
          bestMove = { type: 'swap', tPos: i, sPos: j }
        }
      }
    }

    if (bestMove) {
      if (bestMove.type === 'transfer') {
        colItems[tallest]!.splice(bestMove.pos, 1)
        colItems[shortest]!.push(bestMove.idx)
        colHeights[tallest]! -= photoHeights[bestMove.idx]! + spacing
        colHeights[shortest]! += photoHeights[bestMove.idx]! + spacing
      } else {
        const itemT = colItems[tallest]![bestMove.tPos]!
        const itemS = colItems[shortest]![bestMove.sPos]!
        colItems[tallest]![bestMove.tPos] = itemS
        colItems[shortest]![bestMove.sPos] = itemT
        const diff = photoHeights[itemT]! - photoHeights[itemS]!
        colHeights[tallest]! -= diff
        colHeights[shortest]! += diff
      }
      improved = true
    }
  }

  // Build groups
  const groups: LayoutGroup[] = []
  for (let c = 0; c < columns; c++) {
    colItems[c]!.sort((a, b) => a - b)
    const entries: LayoutEntry[] = colItems[c]!.map((idx, positionIndex) => ({
      index: idx,
      photo: photos[idx]!,
      width: columnWidth,
      height: photoHeights[idx]!,
      positionIndex,
      itemsCount: colItems[c]!.length,
    }))
    groups.push({ type: 'column', index: c, entries })
  }

  return groups
}

// ─── Legacy flat layout (kept for backward compat) ───

/**
 * Optimized masonry layout — places photos into fixed-width columns using a
 * greedy initial assignment, then runs a local search optimization pass to
 * flatten the bottom edge by transferring/swapping items between the tallest
 * and shortest columns. Chronological order is preserved within each column.
 */
export function computeMasonryLayout(options: MasonryLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return { items: [], containerHeight: 0 }

  const availableWidth = Math.max(0, containerWidth - padding * 2)
  const columnWidth = (availableWidth - (columns - 1) * spacing) / columns

  const photoHeights = photos.map(p => columnWidth / (p.width / p.height))

  // Step 1: Greedy assignment — place each photo in the shortest column
  const colItems: number[][] = Array.from({ length: columns }, () => [])
  const colHeights: number[] = new Array(columns).fill(padding)

  for (let i = 0; i < photos.length; i++) {
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    colItems[shortest]!.push(i)
    colHeights[shortest]! += photoHeights[i]! + spacing
  }

  // Step 2: Local search optimization — minimize max-min column height delta
  let improved = true
  let iterations = 0

  while (improved && iterations < 50) {
    improved = false
    iterations++

    let tallest = 0
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! > colHeights[tallest]!) tallest = c
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }

    const currentDelta = colHeights[tallest]! - colHeights[shortest]!
    if (currentDelta <= 2) break

    let bestMove: { type: 'transfer'; idx: number; pos: number } | { type: 'swap'; tPos: number; sPos: number } | null = null
    let bestReduction = 0

    // Try transfers: move one item from tallest to shortest
    for (let i = 0; i < colItems[tallest]!.length; i++) {
      const item = colItems[tallest]![i]!
      const h = photoHeights[item]! + spacing
      const newTH = colHeights[tallest]! - h
      const newSH = colHeights[shortest]! + h

      let newMax = newTH
      let newMin = newSH
      for (let c = 0; c < columns; c++) {
        if (c === tallest || c === shortest) continue
        if (colHeights[c]! > newMax) newMax = colHeights[c]!
        if (colHeights[c]! < newMin) newMin = colHeights[c]!
      }

      const reduction = currentDelta - (newMax - newMin)
      if (reduction > bestReduction) {
        bestReduction = reduction
        bestMove = { type: 'transfer', idx: item, pos: i }
      }
    }

    // Try swaps: exchange items between tallest and shortest
    for (let i = 0; i < colItems[tallest]!.length; i++) {
      for (let j = 0; j < colItems[shortest]!.length; j++) {
        const itemT = colItems[tallest]![i]!
        const itemS = colItems[shortest]![j]!
        const hT = photoHeights[itemT]! + spacing
        const hS = photoHeights[itemS]! + spacing
        if (hT <= hS) continue

        const newTH = colHeights[tallest]! - hT + hS
        const newSH = colHeights[shortest]! - hS + hT

        let newMax = Math.max(newTH, newSH)
        let newMin = Math.min(newTH, newSH)
        for (let c = 0; c < columns; c++) {
          if (c === tallest || c === shortest) continue
          if (colHeights[c]! > newMax) newMax = colHeights[c]!
          if (colHeights[c]! < newMin) newMin = colHeights[c]!
        }

        const reduction = currentDelta - (newMax - newMin)
        if (reduction > bestReduction) {
          bestReduction = reduction
          bestMove = { type: 'swap', tPos: i, sPos: j }
        }
      }
    }

    if (bestMove) {
      if (bestMove.type === 'transfer') {
        colItems[tallest]!.splice(bestMove.pos, 1)
        colItems[shortest]!.push(bestMove.idx)
        colHeights[tallest]! -= photoHeights[bestMove.idx]! + spacing
        colHeights[shortest]! += photoHeights[bestMove.idx]! + spacing
      } else {
        const itemT = colItems[tallest]![bestMove.tPos]!
        const itemS = colItems[shortest]![bestMove.sPos]!
        colItems[tallest]![bestMove.tPos] = itemS
        colItems[shortest]![bestMove.sPos] = itemT
        const diff = photoHeights[itemT]! - photoHeights[itemS]!
        colHeights[tallest]! -= diff
        colHeights[shortest]! += diff
      }
      improved = true
    }
  }

  // Step 3: Generate layout coordinates
  const items: LayoutItem[] = []
  let maxHeight = 0

  for (let c = 0; c < columns; c++) {
    colItems[c]!.sort((a, b) => a - b) // preserve chronological order within column
    let top = padding
    const left = padding + c * (columnWidth + spacing)

    for (const idx of colItems[c]!) {
      items.push({
        index: idx,
        photo: photos[idx]!,
        left,
        top,
        width: columnWidth,
        height: photoHeights[idx]!,
      })
      top += photoHeights[idx]! + spacing
    }
    if (top > maxHeight) maxHeight = top
  }

  items.sort((a, b) => a.index - b.index)

  return { items, containerHeight: Math.max(0, maxHeight - spacing + padding) }
}

export function createMasonryLayoutAdapter(options?: { columns?: number }): {
  name: string
  compute: (input: MasonryLayoutOptions) => { items: LayoutItem[]; containerHeight: number }
} {
  return {
    name: 'masonry',
    compute(input) {
      return computeMasonryLayout({
        ...input,
        columns: input.columns ?? options?.columns ?? 3,
      })
    },
  }
}
