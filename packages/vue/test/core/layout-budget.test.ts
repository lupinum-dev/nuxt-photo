import { describe, expect, it } from 'vite-plus/test'
import type {
  ColumnsLayoutOptions,
  LayoutEntry,
  LayoutGroup,
  PhotoItem,
  RowsLayoutOptions,
} from '../../src/core/types'
import { computeColumnsLayout } from '../../src/core/layout/columns'
import { computeRowsLayout } from '../../src/core/layout/rows'
import { computeMasonryLayout } from '../../src/core/layout/masonry'
import {
  normalizeColumnCount,
  normalizeLayoutNumber,
  validatePhotoDimensions,
} from '../../src/core/layout/types'
import { round } from '../../src/core/utils/math'

// Frozen pre-optimization implementations: catch changed partitions, geometry,
// ordering, metadata, and fallback behavior rather than just visual similarity.

function ratio(item: PhotoItem) {
  return item.width / item.height
}

function columnHeight<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  start: number,
  end: number,
  targetColumnWidth: number,
  spacing: number,
  padding: number,
) {
  let height = 0
  for (let index = start; index < end; index++) {
    height += targetColumnWidth / ratio(items[index]!) + 2 * padding
    if (index > start) height += spacing
  }
  return height
}

function findColumnBreaks<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  columns: number,
  targetColumnWidth: number,
  spacing: number,
  padding: number,
): number[] {
  const count = items.length
  const targetColumnHeight =
    (items.reduce((acc, item) => acc + targetColumnWidth / ratio(item), 0) +
      spacing * Math.max(0, count - columns) +
      2 * padding * count) /
    columns

  const costs: number[][] = Array.from({ length: columns + 1 }, () =>
    Array.from({ length: count + 1 }, () => Infinity),
  )
  const previous: number[][] = Array.from({ length: columns + 1 }, () =>
    Array.from({ length: count + 1 }, () => -1),
  )
  costs[0]![0] = 0

  for (let column = 1; column <= columns; column++) {
    for (let end = column; end <= count; end++) {
      for (let start = column - 1; start < end; start++) {
        const height = columnHeight(items, start, end, targetColumnWidth, spacing, padding)
        const nextCost = costs[column - 1]![start]! + (targetColumnHeight - height) ** 2
        if (nextCost < costs[column]![end]!) {
          costs[column]![end] = nextCost
          previous[column]![end] = start
        }
      }
    }
  }

  const path = [count]
  let end = count
  for (let column = columns; column > 0; column--) {
    const start = previous[column]![end]!
    if (start < 0) return [0, count]
    path.push(start)
    end = start
  }
  return path.reverse()
}

function partitionColumns<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  columns: number,
  spacing: number,
  padding: number,
  targetColumnWidth: number,
): {
  columnsGaps: number[]
  columnsRatios: number[]
  columnGroups: { photo: PhotoItem<TMeta>; index: number }[][]
} {
  const columnsGaps: number[] = []
  const columnsRatios: number[] = []

  if (items.length <= columns) {
    for (let col = 0; col < items.length; col++) {
      columnsGaps[col] = 2 * padding
      columnsRatios[col] = ratio(items[col]!)
    }

    const path = Array.from({ length: items.length + 1 }, (_, i) => i)
    const columnGroups = buildColumnGroups(path, items)
    return { columnsGaps, columnsRatios, columnGroups }
  }

  const path = findColumnBreaks(items, columns, targetColumnWidth, spacing, padding)

  for (let col = 0; col < path.length - 1; col++) {
    const columnItems = items.slice(path[col], path[col + 1])
    columnsGaps[col] = spacing * (columnItems.length - 1) + 2 * padding * columnItems.length
    columnsRatios[col] = 1 / columnItems.reduce((acc, item) => acc + 1 / ratio(item), 0)
  }

  const columnGroups = buildColumnGroups(path, items)
  return { columnsGaps, columnsRatios, columnGroups }
}

function buildColumnGroups<TMeta extends object>(
  path: number[],
  items: readonly PhotoItem<TMeta>[],
) {
  const groups: { photo: PhotoItem<TMeta>; index: number }[][] = []
  for (let col = 0; col < path.length - 1; col++) {
    groups.push(
      items.slice(path[col], path[col + 1]).map((photo, i) => ({
        photo,
        index: path[col]! + i,
      })),
    )
  }
  return groups
}

/**
 * Columns layout — partitions photos into balanced sequential columns.
 * Returns LayoutGroup[]
 * with columnsGaps and columnsRatios metadata for CSS calc() widths.
 */
function oldColumnsLayout<TMeta extends object>(
  options: ColumnsLayoutOptions<TMeta>,
): LayoutGroup<TMeta>[] {
  const containerWidth = normalizeLayoutNumber(options.containerWidth, 0)
  const spacing = normalizeLayoutNumber(options.spacing, 8)
  const padding = normalizeLayoutNumber(options.padding, 0)
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || containerWidth <= 0) return []
  const columns = Math.min(normalizeColumnCount(options.columns), photos.length)

  const targetColumnWidth =
    (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns

  const result = partitionColumns(photos, columns, spacing, padding, targetColumnWidth)

  const totalRatio = result.columnsRatios.reduce((acc, r) => acc + r, 0)

  const groups: LayoutGroup<TMeta>[] = []
  for (let col = 0; col < result.columnGroups.length; col++) {
    const columnItems = result.columnGroups[col]!
    if (columnItems.length === 0) continue

    const totalAdjustedGaps = result.columnsRatios.reduce(
      (acc, colRatio, ratioIndex) =>
        acc + ((result.columnsGaps[col] ?? 0) - (result.columnsGaps[ratioIndex] ?? 0)) * colRatio,
      0,
    )

    const columnWidth =
      ((containerWidth -
        (result.columnGroups.length - 1) * spacing -
        2 * result.columnGroups.length * padding -
        totalAdjustedGaps) *
        (result.columnsRatios[col] ?? 0)) /
      totalRatio

    const entries: LayoutEntry<TMeta>[] = columnItems.map(({ photo, index }, positionIndex) => ({
      index,
      photo,
      width: columnWidth,
      height: columnWidth / ratio(photo),
      positionIndex,
      itemsCount: columnItems.length,
    }))

    if (entries.some((e) => e.width <= 0 || e.height <= 0)) {
      if (columns > 1) {
        return oldColumnsLayout({
          ...options,
          containerWidth,
          spacing,
          padding,
          columns: columns - 1,
        })
      }
      return []
    }

    groups.push({
      type: 'column',
      index: col,
      entries,
      columnsGaps: result.columnsGaps,
      columnsRatios: result.columnsRatios,
    })
  }

  return groups
}

/** Return the aspect oldRatio for a photo item. */
function oldRatio<TMeta extends object>(item: PhotoItem<TMeta>) {
  return item.width / item.height
}

/** Estimate how many next-row candidates the row solver should inspect. */
function oldFindIdealNodeSearch<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  targetRowHeight: number,
  containerWidth: number,
) {
  const minRatio = items.reduce((acc, item) => Math.min(acc, oldRatio(item)), Number.MAX_VALUE)
  return round(containerWidth / targetRowHeight / minRatio) + 2
}

/** Compute the shared height that makes a row fill the available width exactly. */
function oldGetCommonHeight<TMeta extends object>(
  row: readonly PhotoItem<TMeta>[],
  containerWidth: number,
  spacing: number,
  padding: number,
) {
  const rowWidth = containerWidth - (row.length - 1) * spacing - 2 * padding * row.length
  const totalAspectRatio = row.reduce((acc, item) => acc + oldRatio(item), 0)
  return rowWidth / totalAspectRatio
}

/** Score a candidate row break for the Knuth-Plass row layout solver. */
function oldCost<TMeta extends object>(
  items: readonly PhotoItem<TMeta>[],
  start: number,
  end: number,
  width: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number | undefined {
  const row = items.slice(start, end)
  const commonHeight = oldGetCommonHeight(row, width, spacing, padding)
  if (commonHeight <= 0) return undefined
  return (commonHeight - targetRowHeight) ** 2 * row.length
}

/**
 * Find row breaks using a bounded dynamic-programming search.
 *
 * Same idea as the TeX line-breaker: pick break points that minimise the total
 * "badness" of all rows, not just each row locally. A greedy packer can pick a
 * good-looking first row and leave an awkwardly short or tall final row;
 * this bounded DP avoids many of those cases by considering a window of
 * previous breaks for each position.
 *
 * Recurrence:
 *   minCost[0] = 0
 *   minCost[i] = min over j in [i − limitNodeSearch, i) of
 *                  minCost[j] + oldCost(photos[j..i), container, targetHeight, …)
 *
 * `oldCost()` returns the squared deviation of the row's scaled height from the
 * target height (see {@link ./helpers}) — rows that are too short or too tall
 * are penalised quadratically, so a mediocre row is preferred to one bad row.
 *
 * `limitNodeSearch` is a dynamic upper bound on how far back `j` ranges for
 * each `i`. A naive search would be O(N²); in practice the optimal break for
 * position i sits a bounded number of photos behind it (no row contains 100
 * photos), so we cap the window and get O(N·K).
 *
 * Path reconstruction: `pointers[i]` stores the `j` that produced `minCost[i]`.
 * We walk pointers from N back to 0 to recover the ordered break indices, then
 * reverse to get [0, …, N].
 *
 * Typed arrays (Float64Array / Int32Array) avoid V8 allocating boxed numbers
 * per cell — meaningful on large galleries (hundreds of photos).
 */
function oldFindRowBreaks<TMeta extends object>(
  photos: readonly PhotoItem<TMeta>[],
  containerWidth: number,
  targetRowHeight: number,
  spacing: number,
  padding: number,
): number[] | undefined {
  const N = photos.length
  if (N === 0) return undefined

  const limitNodeSearch = oldFindIdealNodeSearch(photos, targetRowHeight, containerWidth)

  const minCost = new Float64Array(N + 1).fill(Infinity)
  const pointers = new Int32Array(N + 1).fill(0)
  minCost[0] = 0

  for (let i = 1; i <= N; i++) {
    const start = Math.max(0, i - limitNodeSearch)
    for (let j = i - 1; j >= start; j--) {
      const currentCost = oldCost(photos, j, i, containerWidth, targetRowHeight, spacing, padding)
      if (currentCost === undefined) continue

      const totalCost = minCost[j]! + currentCost
      if (totalCost < minCost[i]!) {
        minCost[i] = totalCost
        pointers[i] = j
      }
    }
  }

  if (minCost[N] === Infinity) return undefined

  // Reconstruct path by walking backwards
  const path: number[] = []
  let curr = N
  while (curr > 0) {
    path.push(curr)
    curr = pointers[curr]!
  }
  path.push(0)
  path.reverse()

  return path
}

/** Convert row-break indices into concrete layout groups with sized entries. */
function oldPathToGroups<TMeta extends object>(
  path: number[],
  photos: readonly PhotoItem<TMeta>[],
  containerWidth: number,
  spacing: number,
  padding: number,
): LayoutGroup<TMeta>[] {
  const groups: LayoutGroup<TMeta>[] = []

  for (let rowIndex = 1; rowIndex < path.length; rowIndex += 1) {
    const rowItems = photos
      .map((photo, index) => ({ photo, index }))
      .slice(path[rowIndex - 1], path[rowIndex])

    const height = oldGetCommonHeight(
      rowItems.map(({ photo }) => photo),
      containerWidth,
      spacing,
      padding,
    )

    groups.push({
      type: 'row',
      index: rowIndex - 1,
      entries: rowItems.map(({ photo, index }, positionIndex) => ({
        index,
        photo,
        width: height * oldRatio(photo),
        height,
        positionIndex,
        itemsCount: rowItems.length,
      })),
    })
  }

  return groups
}

/** Compute a justified rows layout using the global row-break solver. */
function oldComputeRowsLayout<TMeta extends object>(
  options: RowsLayoutOptions<TMeta>,
): LayoutGroup<TMeta>[] {
  const { containerWidth, spacing = 8, padding = 0, targetRowHeight = 300 } = options

  const photos = validatePhotoDimensions(options.photos)

  if (photos.length === 0) return []

  const path = oldFindRowBreaks(photos, containerWidth, targetRowHeight, spacing, padding)
  if (path === undefined) return []

  return oldPathToGroups(path, photos, containerWidth, spacing, padding)
}

function random(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

function photos(count: number, next: () => number): PhotoItem[] {
  return Array.from({ length: count }, (_, index) => {
    const choice = next()
    const aspect = choice < 0.05 ? 1 / 20 : choice < 0.1 ? 20 : 0.5 + next() * 2
    return { id: String(index), src: `/${index}.jpg`, width: aspect * 1000, height: 1000 }
  })
}

describe('layout scaling', () => {
  it('matches the old solvers on 500 seeded mixed-ratio photo sets', () => {
    const next = random(0x12345678)
    for (let sample = 0; sample < 500; sample++) {
      const options = {
        photos: photos(1 + Math.floor(next() * 300), next),
        columns: 1 + Math.floor(next() * 8),
        spacing: Math.floor(next() * 25),
        padding: Math.floor(next() * 25),
        containerWidth: 200 + Math.floor(next() * 1801),
        targetRowHeight: 100 + Math.floor(next() * 401),
      }
      expect(computeColumnsLayout(options), `columns sample ${sample}`).toEqual(
        oldColumnsLayout(options),
      )
      expect(computeRowsLayout(options), `rows sample ${sample}`).toEqual(
        oldComputeRowsLayout(options),
      )
    }
  }, 60_000)

  it('preserves column ties for repeated aspect ratios', () => {
    for (const aspect of [1 / 20, 1, 1.3, 20]) {
      for (let count = 2; count <= 40; count++) {
        for (let columns = 1; columns <= 8; columns++) {
          const options = {
            photos: Array.from({ length: count }, (_, index) => ({
              id: String(index),
              src: `/${index}.jpg`,
              width: aspect * 1000,
              height: 1000,
            })),
            columns,
            containerWidth: 973,
            spacing: 7,
            padding: 3,
          }
          expect(
            computeColumnsLayout(options),
            `aspect ${aspect}, count ${count}, columns ${columns}`,
          ).toEqual(oldColumnsLayout(options))
        }
      }
    }
  })

  // A cubic column search or a full photo rescan per row freezes large albums.
  it.each([
    ['rows', computeRowsLayout],
    ['columns', computeColumnsLayout],
    ['masonry', computeMasonryLayout],
  ] as const)('%s lays out 5,000 photos within 250 ms', (_name, layout) => {
    const options = { photos: photos(5000, random(0xabcdef)), containerWidth: 1200, columns: 3 }
    layout(options)
    const start = performance.now()
    const result = layout(options)
    const elapsed = performance.now() - start
    expect(result.flatMap((group) => group.entries)).toHaveLength(5000)
    expect(elapsed).toBeLessThan(250)
  })
})
