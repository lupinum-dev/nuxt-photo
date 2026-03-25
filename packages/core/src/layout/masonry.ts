import type { LayoutItem, MasonryLayoutOptions } from '../types'

/**
 * Masonry layout — places each photo in the shortest column.
 * Unlike columns layout, this optimizes for even column heights.
 */
export function computeMasonryLayout(options: MasonryLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return { items: [], containerHeight: 0 }

  const availableWidth = containerWidth - padding * 2
  const columnWidth = (availableWidth - (columns - 1) * spacing) / columns

  const columnHeights = new Array<number>(columns).fill(padding)
  const items: LayoutItem[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    const aspect = photo.width / photo.height
    const height = columnWidth / aspect

    // Find the shortest column
    let shortestCol = 0
    for (let c = 1; c < columns; c++) {
      if (columnHeights[c]! < columnHeights[shortestCol]!) {
        shortestCol = c
      }
    }

    const left = padding + shortestCol * (columnWidth + spacing)

    items.push({
      index: i,
      photo,
      left,
      top: columnHeights[shortestCol]!,
      width: columnWidth,
      height,
    })

    columnHeights[shortestCol]! += height + spacing
  }

  const containerHeight = Math.max(...columnHeights) - spacing + padding

  return { items, containerHeight }
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
