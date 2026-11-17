import {
  resolveResponsiveValue,
  type LayoutEntry,
  type LayoutGroup,
  type MasonryLayoutOptions,
  type ResolvedPhotoItem as PhotoItem,
  type ResponsiveParameter,
} from '../types'
import { round } from '../utils/math'
import { normalizeColumnCount, normalizeLayoutNumber, validatePhotoDimensions } from './types'
import { DEFAULT_BREAKPOINTS, DEFAULT_COLUMNS, DEFAULT_PADDING, DEFAULT_SPACING } from './constants'
import {
  absoluteItemsCss,
  containerLength,
  containerQueryCss,
  planWidths,
  type AlbumPlan,
  type AlbumPlanWidths,
} from './plan'

/**
 * Masonry layout — places photos into equal-width columns using greedy
 * shortest-column assignment. Chronological order is preserved within each
 * column and item assignment is deterministic.
 * Returns LayoutGroup[] for flexbox rendering.
 */
export function computeMasonryLayout<TMeta extends object>(
  options: MasonryLayoutOptions<TMeta>,
): LayoutGroup<TMeta>[] {
  const containerWidth = normalizeLayoutNumber(options.containerWidth, 0)
  const spacing = normalizeLayoutNumber(options.spacing, DEFAULT_SPACING)
  const padding = normalizeLayoutNumber(options.padding, DEFAULT_PADDING)
  const columns = normalizeColumnCount(options.columns)
  const photos = validatePhotoDimensions(options.photos)
  if (photos.length === 0 || containerWidth <= 0) return []

  const columnWidth = (containerWidth - spacing * (columns - 1) - 2 * padding * columns) / columns
  if (!Number.isFinite(columnWidth) || columnWidth <= 0) {
    if (columns > 1) {
      return computeMasonryLayout({
        ...options,
        containerWidth,
        spacing,
        padding,
        columns: columns - 1,
      })
    }
    return []
  }
  const photoHeights = photos.map((p) => columnWidth / (p.width / p.height))

  const colItems: number[][] = Array.from({ length: columns }, () => [])
  const colHeights = Array.from({ length: columns }, () => 0)

  for (let i = 0; i < photos.length; i++) {
    let shortest = 0
    for (let c = 1; c < columns; c++) {
      if (colHeights[c]! < colHeights[shortest]!) shortest = c
    }
    colItems[shortest]!.push(i)
    colHeights[shortest]! += photoHeights[i]! + spacing
  }

  const groups: LayoutGroup<TMeta>[] = []
  for (let c = 0; c < columns; c++) {
    const entries: LayoutEntry<TMeta>[] = colItems[c]!.map((idx, positionIndex) => ({
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

/**
 * Plan a masonry album that CSS alone positions at every container width.
 *
 * Planned widths that share a column count, spacing and padding form a run, and
 * {@link computeMasonryLayout} picks each photo's column once, at the run's first
 * width, so a photo keeps its column while the album resizes within the run.
 * Columns share one width, linear in the album width (`100cqi`). Per run, a photo
 * holds its column (`--np-c`), the summed height/width ratios of the photos above
 * it in that column (`--np-q`) and their count (`--np-k`); zeros are left out.
 * With one run these values go inline; otherwise each run's CSS sets them on the
 * photo's class. The DOM keeps `photos` order.
 */
export function computeMasonryPlan<TMeta extends object>(options: {
  photos: readonly PhotoItem<TMeta>[]
  containerName: string
  breakpoints?: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
}): AlbumPlan {
  const { photos, containerName } = options
  if (!photos.length) return { css: '', frameStyle: {}, items: [], order: [], widths: [] }

  const runs: (AlbumPlanWidths & {
    key: string
    frame: string
    values: Record<string, string>[]
  })[] = []
  for (const width of planWidths(options.breakpoints, DEFAULT_BREAKPOINTS)) {
    const spacing = round(resolveResponsiveValue(options.spacing, width, DEFAULT_SPACING), 3)
    const padding = round(resolveResponsiveValue(options.padding, width, DEFAULT_PADDING), 3)
    const columns = resolveResponsiveValue(options.columns, width, DEFAULT_COLUMNS)
    const groups = computeMasonryLayout({
      photos,
      containerWidth: width,
      spacing,
      padding,
      columns,
    })
    const count = groups.length
    const key = `${count},${spacing},${padding}`
    // Within a run, keep the picks of its first width.
    if (!count || runs.at(-1)?.key === key) continue

    const gap = (count - 1) * spacing + 2 * count * padding
    const share = 1 / count
    const values: Record<string, string>[] = photos.map(() => ({}))
    const bottoms: string[] = []
    for (const group of groups) {
      let above = 0
      for (const [position, entry] of group.entries.entries()) {
        const photo = values[entry.index]!
        if (group.index) photo['--np-c'] = `${group.index}`
        if (position)
          Object.assign(photo, { '--np-q': `${round(above, 6)}`, '--np-k': `${position}` })
        above += entry.photo.height / entry.photo.width
      }
      const placed = group.entries.length
      if (placed) {
        bottoms.push(
          containerLength(
            share * above,
            -share * gap * above + placed * 2 * padding + (placed - 1) * spacing,
          ),
        )
      }
    }
    runs.push({
      key,
      start: runs.length ? width : 0,
      frame:
        `.np-album__frame{--np-gap:${spacing}px;--np-padding:${padding}px;` +
        `--np-w:${containerLength(share, -share * gap)};height:max(${bottoms.join(',')})}`,
      values,
      shares: photos.map(() => share),
      gaps: photos.map(() => gap),
    })
  }

  const inline = runs.length === 1
  const spans = runs.map(({ start, frame, values }) => ({
    start,
    rules: inline
      ? frame
      : frame +
        values
          .map((photo, index) => {
            const declarations = Object.entries(photo).map(([name, value]) => `${name}:${value}`)
            return declarations.length ? `.np-item-${index}{${declarations.join(';')}}` : ''
          })
          .join(''),
  }))
  return {
    css:
      containerQueryCss(containerName, spans) +
      absoluteItemsCss(
        containerName,
        'inset-inline-start:calc(var(--np-c)*(var(--np-w) + var(--np-step)));' +
          'top:calc(var(--np-w)*var(--np-q) + var(--np-k)*var(--np-step))',
        // Generated values leave out zeros; `:where()` defaults lose to every one of them.
        ':where(.np-album__item){--np-c:0;--np-q:0;--np-k:0}',
      ),
    frameStyle: {},
    items: photos.map((_, index) =>
      inline
        ? { index, style: runs[0]!.values[index]! }
        : { index, style: {}, className: `np-item-${index}` },
    ),
    order: photos.map((_, index) => index),
    widths: runs.map(({ start, shares, gaps }) => ({ start, shares, gaps })),
  }
}
