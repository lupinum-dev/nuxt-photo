import type { BentoLayoutOptions, LayoutGroup, PhotoItem } from '../types'

function ratio(item: PhotoItem) {
  return item.width / item.height
}

type Span = { colSpan: number; rowSpan: number }

function getMetaSpan(photo: PhotoItem, maxCols: number): Span | undefined {
  const meta = photo.meta as Record<string, unknown> | undefined
  if (!meta) return undefined
  if (meta.span === '2x2' || meta.featured === true) return { colSpan: Math.min(2, maxCols), rowSpan: 2 }
  if (meta.span === 'wide') return { colSpan: Math.min(2, maxCols), rowSpan: 1 }
  if (meta.span === 'tall') return { colSpan: 1, rowSpan: 2 }
  return undefined
}

function spanForRatio(r: number, maxCols: number): Span {
  if (r >= 1.4) return { colSpan: Math.min(2, maxCols), rowSpan: 1 }
  if (r <= 0.85) return { colSpan: 1, rowSpan: 2 }
  return { colSpan: Math.min(2, maxCols), rowSpan: 2 }
}

function computeAutoSpans(photos: PhotoItem[], maxCols: number): Span[] {
  const n = photos.length
  const spans: Span[] = new Array(n)

  // 1. Apply meta overrides first
  const metaIndices = new Set<number>()
  for (let i = 0; i < n; i++) {
    const meta = getMetaSpan(photos[i]!, maxCols)
    if (meta) {
      spans[i] = meta
      metaIndices.add(i)
    }
  }

  // 2. Score remaining photos by deviation from square (higher = more interesting to span)
  const candidates: { index: number; score: number; ratio: number }[] = []
  for (let i = 0; i < n; i++) {
    if (metaIndices.has(i)) continue
    const r = ratio(photos[i]!)
    candidates.push({ index: i, score: Math.abs(Math.log(r)), ratio: r })
  }

  // Sort by score descending — most extreme aspect ratios first
  candidates.sort((a, b) => b.score - a.score)

  // 3. Target ~30% spanned (including meta), minimum 2
  const targetSpanned = Math.max(2, Math.ceil(n * 0.3))
  const remainingSlots = Math.max(0, targetSpanned - metaIndices.size)

  // 4. Pick top candidates, spacing them out (no two consecutive)
  const spannedIndices = new Set(metaIndices)
  let assigned = 0
  for (const cand of candidates) {
    if (assigned >= remainingSlots) break
    // Ensure no adjacent spanned item
    if (spannedIndices.has(cand.index - 1) || spannedIndices.has(cand.index + 1)) continue
    spans[cand.index] = spanForRatio(cand.ratio, maxCols)
    spannedIndices.add(cand.index)
    assigned++
  }

  // If we still need more (couldn't space them out), relax the adjacency constraint
  if (assigned < remainingSlots) {
    for (const cand of candidates) {
      if (assigned >= remainingSlots) break
      if (spannedIndices.has(cand.index)) continue
      spans[cand.index] = spanForRatio(cand.ratio, maxCols)
      spannedIndices.add(cand.index)
      assigned++
    }
  }

  // 5. Fill remaining with 1x1
  for (let i = 0; i < n; i++) {
    if (!spans[i]) spans[i] = { colSpan: 1, rowSpan: 1 }
  }

  return spans
}

const PATTERN_CYCLE: Array<'wide' | '2x2' | 'tall'> = ['wide', '2x2', 'tall', '2x2']

export function computeBentoLayout(options: BentoLayoutOptions): LayoutGroup[] {
  const {
    photos,
    containerWidth,
    spacing = 8,
    padding = 0,
    columns = 3,
    rowHeight = 280,
    sizing = 'auto',
    patternInterval = 5,
  } = options

  if (photos.length === 0) return []

  const cellWidth = (containerWidth - (columns - 1) * spacing - 2 * padding * columns) / columns

  let spans: Span[]

  switch (sizing) {
    case 'auto':
      spans = computeAutoSpans(photos, columns)
      break
    case 'pattern': {
      let cycleIndex = 0
      spans = photos.map((photo, index) => {
        const meta = getMetaSpan(photo, columns)
        if (meta) return meta
        if (index % patternInterval === 0) {
          const type = PATTERN_CYCLE[cycleIndex % PATTERN_CYCLE.length]!
          cycleIndex++
          if (type === 'wide') return { colSpan: Math.min(2, columns), rowSpan: 1 }
          if (type === 'tall') return { colSpan: 1, rowSpan: 2 }
          return { colSpan: Math.min(2, columns), rowSpan: 2 }
        }
        return { colSpan: 1, rowSpan: 1 }
      })
      break
    }
    case 'manual':
      spans = photos.map(photo => getMetaSpan(photo, columns) ?? { colSpan: 1, rowSpan: 1 })
      break
  }

  const entries = photos.map((photo, index) => {
    const { colSpan, rowSpan } = spans[index]!
    const width = cellWidth * colSpan + spacing * (colSpan - 1) + 2 * padding * colSpan
    const height = rowHeight * rowSpan + spacing * (rowSpan - 1) + 2 * padding * rowSpan

    return {
      index,
      photo,
      width,
      height,
      positionIndex: index,
      itemsCount: photos.length,
      colSpan,
      rowSpan,
    }
  })

  return [{
    type: 'grid' as const,
    index: 0,
    entries,
  }]
}
