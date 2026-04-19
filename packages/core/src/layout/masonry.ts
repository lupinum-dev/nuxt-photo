import type { LayoutEntry, LayoutGroup, MasonryLayoutOptions } from '../types'
import { validatePhotoDimensions } from './types'

/**
 * Masonry layout — places photos into equal-width columns using greedy
 * shortest-column assignment with local search optimization to flatten
 * the bottom edge. Chronological order is preserved within each column.
 * Returns LayoutGroup[] for flexbox rendering.
 */
export function computeMasonryLayout(
  options: MasonryLayoutOptions,
): LayoutGroup[] {
  const { containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || columns < 1) return []

  const columnWidth =
    (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
  const photoHeights = photos.map((p) => columnWidth / (p.width / p.height))

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

  // Local search optimization — minimize max-min column height delta
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

    let bestMove:
      | { type: 'transfer'; idx: number; pos: number }
      | { type: 'swap'; tPos: number; sPos: number }
      | null = null
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
