import type { LayoutItem, ColumnsLayoutOptions } from '../types'

/**
 * Columns layout — distributes photos into equal-width columns.
 * Photos maintain their aspect ratio within each column.
 */
export function computeColumnsLayout(options: ColumnsLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return { items: [], containerHeight: 0 }

  const availableWidth = containerWidth - padding * 2
  const columnWidth = (availableWidth - (columns - 1) * spacing) / columns

  // Distribute photos round-robin into columns
  const columnHeights = new Array<number>(columns).fill(padding)
  const items: LayoutItem[] = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    const col = i % columns
    const aspect = photo.width / photo.height
    const height = columnWidth / aspect
    const left = padding + col * (columnWidth + spacing)

    items.push({
      index: i,
      photo,
      left,
      top: columnHeights[col]!,
      width: columnWidth,
      height,
    })

    columnHeights[col]! += height + spacing
  }

  const containerHeight = Math.max(...columnHeights) - spacing + padding

  return { items, containerHeight }
}

export function createColumnsLayoutAdapter(options?: { columns?: number }): {
  name: string
  compute: (input: ColumnsLayoutOptions) => { items: LayoutItem[]; containerHeight: number }
} {
  return {
    name: 'columns',
    compute(input) {
      return computeColumnsLayout({
        ...input,
        columns: input.columns ?? options?.columns ?? 3,
      })
    },
  }
}
