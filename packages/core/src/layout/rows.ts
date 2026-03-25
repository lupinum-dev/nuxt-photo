import type { LayoutItem, PhotoItem, RowsLayoutOptions } from '../types'

/**
 * Justified rows layout — fits photos into rows of approximately equal height.
 * Uses a greedy algorithm that fills each row to match the target height.
 */
export function computeRowsLayout(options: RowsLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, targetRowHeight = 300 } = options
  if (photos.length === 0) return { items: [], containerHeight: 0 }

  const availableWidth = containerWidth - padding * 2
  const items: LayoutItem[] = []
  let currentTop = padding

  // Split photos into rows using greedy bin packing
  const rows = buildRows(photos, availableWidth, targetRowHeight, spacing)

  for (const row of rows) {
    const rowItems = layoutRow(row.photos, row.startIndex, availableWidth, spacing, padding, currentTop)
    items.push(...rowItems)
    if (rowItems.length > 0) {
      currentTop += rowItems[0]!.height + spacing
    }
  }

  // Remove trailing spacing
  const containerHeight = currentTop - spacing + padding

  return { items, containerHeight }
}

type Row = {
  photos: PhotoItem[]
  startIndex: number
}

function buildRows(
  photos: PhotoItem[],
  availableWidth: number,
  targetRowHeight: number,
  spacing: number,
): Row[] {
  const rows: Row[] = []
  let rowStart = 0

  while (rowStart < photos.length) {
    let rowEnd = rowStart
    let totalAspect = 0

    // Greedily add photos to the row until we exceed or match target height
    while (rowEnd < photos.length) {
      const photo = photos[rowEnd]!
      const aspect = photo.width / photo.height
      const newTotalAspect = totalAspect + aspect
      const gapWidth = (rowEnd - rowStart) * spacing
      const rowHeight = (availableWidth - gapWidth) / newTotalAspect

      if (rowHeight < targetRowHeight && rowEnd > rowStart) {
        // Adding this photo makes the row too short — check if it's better with or without
        const heightWithout = (availableWidth - (rowEnd - rowStart - 1) * spacing) / totalAspect
        const heightWith = rowHeight

        if (Math.abs(heightWith - targetRowHeight) < Math.abs(heightWithout - targetRowHeight)) {
          totalAspect = newTotalAspect
          rowEnd++
        }
        break
      }

      totalAspect = newTotalAspect
      rowEnd++
    }

    rows.push({
      photos: photos.slice(rowStart, rowEnd),
      startIndex: rowStart,
    })
    rowStart = rowEnd
  }

  return rows
}

function layoutRow(
  photos: PhotoItem[],
  startIndex: number,
  availableWidth: number,
  spacing: number,
  padding: number,
  top: number,
): LayoutItem[] {
  if (photos.length === 0) return []

  const totalAspect = photos.reduce((sum, p) => sum + p.width / p.height, 0)
  const gapWidth = (photos.length - 1) * spacing
  const rowHeight = (availableWidth - gapWidth) / totalAspect

  const items: LayoutItem[] = []
  let currentLeft = padding

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    const aspect = photo.width / photo.height
    const width = rowHeight * aspect

    items.push({
      index: startIndex + i,
      photo,
      left: currentLeft,
      top,
      width,
      height: rowHeight,
    })

    currentLeft += width + spacing
  }

  return items
}

export function createRowsLayoutAdapter(options?: { targetRowHeight?: number }): {
  name: string
  compute: (input: RowsLayoutOptions) => { items: LayoutItem[]; containerHeight: number }
} {
  return {
    name: 'rows',
    compute(input) {
      return computeRowsLayout({
        ...input,
        targetRowHeight: input.targetRowHeight ?? options?.targetRowHeight ?? 300,
      })
    },
  }
}
