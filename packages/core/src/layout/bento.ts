import type { BentoLayoutOptions, BentoSizing, LayoutGroup, PhotoItem } from '../types'

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

function getAspectSpan(photo: PhotoItem, maxCols: number): Span {
  const r = ratio(photo)
  if (r > 1.5) return { colSpan: Math.min(2, maxCols), rowSpan: 1 }
  if (r < 0.75) return { colSpan: 1, rowSpan: 2 }
  return { colSpan: 1, rowSpan: 1 }
}

function computeAutoSpans(photos: PhotoItem[], maxCols: number): Span[] {
  const spans: Span[] = []
  let cooldown = 0

  for (let i = 0; i < photos.length; i++) {
    // Meta always wins
    const meta = getMetaSpan(photos[i]!, maxCols)
    if (meta) {
      spans.push(meta)
      cooldown = 2
      continue
    }

    // During cooldown, force 1x1 to prevent clumping
    if (cooldown > 0) {
      spans.push({ colSpan: 1, rowSpan: 1 })
      cooldown--
      continue
    }

    // Try aspect ratio
    const aspect = getAspectSpan(photos[i]!, maxCols)
    if (aspect.colSpan > 1 || aspect.rowSpan > 1) {
      spans.push(aspect)
      cooldown = 2
      continue
    }

    // Fallback: every ~5th unspanned photo gets a 2x2 hero
    const spannedCount = spans.filter(s => s.colSpan > 1 || s.rowSpan > 1).length
    const idealCount = Math.floor((i + 1) / 5)
    if (spannedCount < idealCount && i > 0) {
      spans.push({ colSpan: Math.min(2, maxCols), rowSpan: 2 })
      cooldown = 2
      continue
    }

    spans.push({ colSpan: 1, rowSpan: 1 })
  }

  return spans
}

export function computeBentoLayout(options: BentoLayoutOptions): LayoutGroup[] {
  const {
    photos,
    containerWidth,
    spacing = 8,
    padding = 0,
    columns = 4,
    rowHeight = 240,
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
    case 'pattern':
      spans = photos.map((photo, index) => {
        const meta = getMetaSpan(photo, columns)
        if (meta) return meta
        if (index % patternInterval === 0) return { colSpan: Math.min(2, columns), rowSpan: 2 }
        return { colSpan: 1, rowSpan: 1 }
      })
      break
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
