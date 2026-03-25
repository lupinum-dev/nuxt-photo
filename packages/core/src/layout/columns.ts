import type { LayoutItem, ColumnsLayoutOptions } from '../types'

/**
 * Columns layout — Justified columns that form a perfect grid outline.
 * Items are distributed round-robin into columns, then each column's width
 * is scaled so that all columns reach exactly the same total height,
 * producing flush top and bottom edges.
 */
export function computeColumnsLayout(options: ColumnsLayoutOptions): { items: LayoutItem[]; containerHeight: number } {
  const { photos, containerWidth, spacing = 8, padding = 0, columns = 3 } = options
  if (photos.length === 0 || columns < 1) return { items: [], containerHeight: 0 }

  const availableWidth = Math.max(0, containerWidth - padding * 2)

  // Step 1: Assign photos to columns (round-robin) and compute S_j = sum(h/w) per column
  const colItems: { photo: typeof photos[number]; index: number }[][] = Array.from({ length: columns }, () => [])
  const S = new Array<number>(columns).fill(0)

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]!
    const col = i % columns
    colItems[col]!.push({ photo, index: i })
    S[col]! += photo.height / photo.width
  }

  // Step 2: Solve for the uniform target height H
  let activeCols = 0
  let sumInvS = 0
  let sumSpacingTerm = 0

  for (let j = 0; j < columns; j++) {
    if (S[j]! > 0) {
      activeCols++
      const invS = 1 / S[j]!
      sumInvS += invS
      const Nj = colItems[j]!.length
      if (Nj > 0) {
        sumSpacingTerm += (Nj - 1) * spacing * invS
      }
    }
  }

  const innerAvailableWidth = Math.max(0, availableWidth - (activeCols - 1) * spacing)
  const H = sumInvS > 0 ? Math.max(0, (innerAvailableWidth + sumSpacingTerm) / sumInvS) : 0

  // Step 3: Compute per-column widths and lay out items
  const items: LayoutItem[] = []
  let currentLeft = padding

  for (let j = 0; j < columns; j++) {
    if (S[j]! === 0) continue

    const Nj = colItems[j]!.length
    const Wj = Math.max(0, (H - (Nj - 1) * spacing) / S[j]!)

    let currentTop = padding

    for (const item of colItems[j]!) {
      const aspect = item.photo.width / item.photo.height
      const itemHeight = Wj / aspect

      items.push({
        index: item.index,
        photo: item.photo,
        left: currentLeft,
        top: currentTop,
        width: Wj,
        height: itemHeight,
      })

      currentTop += itemHeight + spacing
    }

    currentLeft += Wj + spacing
  }

  return { items, containerHeight: H + padding * 2 }
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
