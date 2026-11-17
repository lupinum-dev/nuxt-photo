import {
  resolveResponsiveValue,
  type ColumnsLayoutOptions,
  type LayoutEntry,
  type LayoutGroup,
  type ResolvedPhotoItem as PhotoItem,
  type ResponsiveParameter,
} from '../types'
import { round } from '../utils/math'
import { normalizeColumnCount, normalizeLayoutNumber, validatePhotoDimensions } from './types'
import { DEFAULT_BREAKPOINTS, DEFAULT_COLUMNS, DEFAULT_PADDING, DEFAULT_SPACING } from './constants'
import {
  containerLength,
  absoluteItemsCss,
  containerQueryCss,
  planWidths,
  type AlbumPlan,
  type AlbumPlanWidths,
} from './plan'

function ratio(item: PhotoItem) {
  return item.width / item.height
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

  const itemHeights = items.map((item) => targetColumnWidth / ratio(item) + 2 * padding)
  // Prefix sums choose a feasible partition, used only as a cost upper bound.
  // They never decide the result: subtraction can change floating-point ties.
  const prefixes = new Float64Array(count + 1)
  const increasing = itemHeights.every((height) => Number.isFinite(height) && height >= 0)
  for (let index = 0; index < count; index++) {
    prefixes[index + 1] = prefixes[index]! + itemHeights[index]! + spacing
  }
  let upperBound = Infinity
  if (increasing && Number.isFinite(prefixes[count])) {
    let start = 0
    let bound = 0
    for (let column = 1; column <= columns; column++) {
      let end = count
      if (column < columns) {
        const target = (prefixes[count]! * column) / columns
        let low = start + 1
        let high = count - (columns - column)
        while (low < high) {
          const middle = Math.floor((low + high) / 2)
          if (prefixes[middle]! < target) low = middle + 1
          else high = middle
        }
        end = low
        if (
          end > start + 1 &&
          Math.abs(prefixes[end - 1]! - target) < Math.abs(prefixes[end]! - target)
        )
          end--
      }
      let height = 0
      for (let index = start; index < end; index++) {
        height += itemHeights[index]!
        if (index > start) height += spacing
      }
      bound += (targetColumnHeight - height) ** 2
      start = end
    }
    upperBound = bound
  }

  let costs = new Float64Array(count + 1).fill(Infinity)
  costs[0] = 0
  const previous = Array.from({ length: columns + 1 }, () => new Int32Array(count + 1).fill(-1))

  for (let column = 1; column <= columns; column++) {
    const nextCosts = new Float64Array(count + 1).fill(Infinity)
    // Visit starts in order so equal costs keep the first start.
    // Extend each segment in O(1), adding heights in photo order so rounding is
    // stable. A partial cost above a feasible complete cost cannot win: all
    // remaining costs are nonnegative. Equal costs are kept, not pruned.
    // The worst case remains O(columns * count²), without a heuristic window.
    for (let start = column - 1; start < count; start++) {
      const priorCost = costs[start]!
      if (priorCost === Infinity || priorCost > upperBound) continue
      let height = 0
      for (let end = start + 1; end <= count; end++) {
        height += itemHeights[end - 1]!
        if (end > start + 1) height += spacing
        const nextCost = priorCost + (targetColumnHeight - height) ** 2
        // Once above the target, increasing heights can only raise this cost.
        if (nextCost > upperBound) {
          if (increasing && height >= targetColumnHeight) break
          continue
        }
        if (nextCost < nextCosts[end]!) {
          nextCosts[end] = nextCost
          previous[column]![end] = start
        }
      }
    }
    costs = nextCosts
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
export function computeColumnsLayout<TMeta extends object>(
  options: ColumnsLayoutOptions<TMeta>,
): LayoutGroup<TMeta>[] {
  const containerWidth = normalizeLayoutNumber(options.containerWidth, 0)
  const spacing = normalizeLayoutNumber(options.spacing, DEFAULT_SPACING)
  const padding = normalizeLayoutNumber(options.padding, DEFAULT_PADDING)
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
        return computeColumnsLayout({
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

/**
 * Plan a columns album that CSS alone positions at every container width.
 *
 * At each planned width, {@link computeColumnsLayout} splits the photos into
 * consecutive runs, one per column. The DOM keeps `photos` order, so one
 * `nth-child` range per column sets its width and start, both linear in the
 * album width (`100cqi`). A photo's top is its column width times the summed
 * height/width ratios of the photos above it, plus their padding and spacing;
 * each item carries its running ratio sum (`--np-p`) and index (`--np-i`), so
 * these never change between widths.
 */
export function computeColumnsPlan<TMeta extends object>(options: {
  photos: readonly PhotoItem<TMeta>[]
  containerName: string
  breakpoints?: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}): AlbumPlan {
  const { photos, containerName } = options
  if (!photos.length) return { css: '', frameStyle: {}, items: [], order: [], widths: [] }
  // Running sum of height / width before each photo, and in total.
  const sums = [0]
  for (const photo of photos) sums.push(sums.at(-1)! + 1 / ratio(photo))

  const spans: (AlbumPlanWidths & { rules: string })[] = []
  for (const width of planWidths(options.breakpoints, DEFAULT_BREAKPOINTS)) {
    const spacing = round(resolveResponsiveValue(options.spacing, width, DEFAULT_SPACING), 3)
    const padding = round(resolveResponsiveValue(options.padding, width, DEFAULT_PADDING), 3)
    const columns = resolveResponsiveValue(options.columns, width, DEFAULT_COLUMNS)
    const groups = computeColumnsLayout({
      photos,
      containerWidth: width,
      spacing,
      padding,
      columns,
    })
    if (!groups.length) continue

    const totalRatio = groups[0]!.columnsRatios!.reduce((sum, value) => sum + value, 0)
    const shares: number[] = []
    const gaps: number[] = []
    const columnRules: string[] = []
    const bottoms: string[] = []
    let left = { a: 0, b: 0 }
    for (const group of groups) {
      const { columnsGaps, columnsRatios } = group
      const own = columnsGaps![group.index]!
      // The same width formula as computeColumnsLayout, split into share and gaps.
      const share = columnsRatios![group.index]! / totalRatio
      const gap =
        (groups.length - 1) * spacing +
        2 * groups.length * padding +
        columnsRatios!.reduce((sum, value, index) => sum + (own - columnsGaps![index]!) * value, 0)
      const first = group.entries[0]!.index
      const end = group.entries.at(-1)!.index + 1
      const count = end - first
      for (let index = first; index < end; index++) {
        shares.push(share)
        gaps.push(gap)
      }
      const range =
        (first > 0 ? `:nth-child(n+${first + 1})` : '') +
        (end < photos.length ? `:nth-child(-n+${end})` : '')
      columnRules.push(
        `.np-album__item${range}{--np-w:${containerLength(share, -share * gap)};` +
          `--np-x:${containerLength(left.a, left.b)};--np-p0:${round(sums[first]!, 6)};--np-i0:${first}}`,
      )
      const height = sums[end]! - sums[first]!
      bottoms.push(
        containerLength(
          share * height,
          -share * gap * height + count * 2 * padding + (count - 1) * spacing,
        ),
      )
      left = { a: left.a + share, b: left.b - share * gap + 2 * padding + spacing }
    }
    const rules =
      `.np-album__frame{--np-gap:${spacing}px;--np-padding:${padding}px;height:max(${bottoms.join(',')})}` +
      columnRules.join('')
    if (spans.at(-1)?.rules === rules) continue
    spans.push({ start: spans.length ? width : 0, rules, shares, gaps })
  }

  return {
    css:
      containerQueryCss(containerName, spans) +
      absoluteItemsCss(
        containerName,
        'inset-inline-start:var(--np-x);' +
          'top:calc(var(--np-w)*(var(--np-p) - var(--np-p0)) + (var(--np-i) - var(--np-i0))*var(--np-step))',
      ),
    frameStyle: {},
    items: photos.map((_, index) => ({
      index,
      style: { '--np-p': String(round(sums[index]!, 6)), '--np-i': String(index) },
    })),
    order: photos.map((_, index) => index),
    widths: spans.map(({ start, shares, gaps }) => ({ start, shares, gaps })),
  }
}
