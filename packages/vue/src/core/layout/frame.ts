import {
  resolveResponsiveValue,
  type ResolvedPhotoItem as PhotoItem,
  type ResponsiveParameter,
} from '../types'
import { round } from '../utils/math'
import { computeBentoLayout } from './bento'
import { computeMosaicLayout } from './mosaic'
import { computeAccordionGrow } from './accordion'
import { normalizeColumnCount } from './types'
import {
  DEFAULT_BENTO_COLUMNS,
  DEFAULT_BREAKPOINTS,
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
} from './constants'
import { containerQueryCss, planWidths, type AlbumPlan, type AlbumPlanItem } from './plan'

export type FrameLayoutType = 'grid' | 'bento' | 'mosaic' | 'accordion'

export function computeFramePlan<TMeta extends object>(options: {
  type: FrameLayoutType
  photos: readonly PhotoItem<TMeta>[]
  containerName: string
  breakpoints?: readonly number[]
  spacing?: ResponsiveParameter<number>
  padding?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
  aspectRatio?: number
  featured?: (photo: PhotoItem<TMeta>, index: number) => boolean
  max?: number
}): AlbumPlan {
  const { type, photos, containerName } = options
  const fallback = type === 'grid' ? 1 : type === 'mosaic' || type === 'bento' ? 4 / 3 : 2
  const ratio =
    Number.isFinite(options.aspectRatio) && options.aspectRatio! > 0
      ? options.aspectRatio!
      : fallback
  const frameStyle = { '--np-aspect-ratio': String(round(ratio, 5)) }
  if (!photos.length) return { css: '', frameStyle, items: [], order: [], widths: [] }

  const starts = [0, ...planWidths(options.breakpoints, DEFAULT_BREAKPOINTS)]
  const spans: { start: number; body: string; columns: number }[] = []
  for (const width of starts) {
    const spacing = round(resolveResponsiveValue(options.spacing, width, DEFAULT_SPACING), 3)
    const padding = round(resolveResponsiveValue(options.padding, width, DEFAULT_PADDING), 3)
    const columns = normalizeColumnCount(
      resolveResponsiveValue(
        options.columns,
        width,
        type === 'bento' ? DEFAULT_BENTO_COLUMNS : DEFAULT_COLUMNS,
      ),
    )
    const body =
      `--np-gap:${spacing}px;--np-padding:${padding}px` +
      (type === 'grid' || type === 'bento' ? `;--np-columns:${columns}` : '')
    if (spans.at(-1)?.body !== body) spans.push({ start: width, body, columns })
  }
  let bentoOrder: number[] = []
  const bentoRules = new Map<number, string>()
  const bentoShares = new Map<number, number[]>()
  if (type === 'bento') {
    const primary = Math.max(...spans.map((span) => span.columns))
    const primaryLayout = computeBentoLayout({
      photos,
      columns: primary,
      aspectRatio: ratio,
      featured: options.featured,
    })
    bentoOrder = primaryLayout.tiles.map((tile) => tile.index)
    const featuredOriginal = (index: number) =>
      options.featured ? options.featured(photos[index]!, index) : index === 0
    for (const columns of new Set(spans.map((span) => span.columns))) {
      const layout =
        columns === primary
          ? primaryLayout
          : computeBentoLayout({
              photos: bentoOrder.map((index) => photos[index]!),
              columns,
              aspectRatio: ratio,
              featured: (_, position) => featuredOriginal(bentoOrder[position]!),
              maxShift: 0,
            })
      if (columns !== primary && layout.tiles.some((tile, position) => tile.index !== position)) {
        throw new Error('[nuxt-photo] Bento layout changed the fixed DOM order')
      }
      bentoShares.set(
        columns,
        layout.tiles.map((tile) => tile.columnSpan / columns),
      )
      bentoRules.set(
        columns,
        layout.tiles
          .map(
            (tile, position) =>
              `.np-item-${position}{grid-column:${tile.column + 1} / span ${tile.columnSpan};grid-row:${tile.row + 1} / span ${tile.rowSpan}}`,
          )
          .join(''),
      )
    }
  }
  const css = containerQueryCss(
    containerName,
    spans.map((span) => ({
      start: span.start,
      rules: `.np-album__frame{${span.body}}${bentoRules.get(span.columns) ?? ''}`,
    })),
  )

  let items: AlbumPlanItem[]
  let mosaicShares: number[] = []
  if (type === 'bento') {
    items = bentoOrder.map((index, position) => ({
      index,
      style: {},
      className: `np-item-${position}`,
    }))
  } else if (type === 'mosaic') {
    const { tiles, hidden } = computeMosaicLayout({
      photos,
      aspectRatio: ratio,
      max: options.max,
    })
    mosaicShares = tiles.map((tile) => tile.width)
    items = tiles.map((tile, position) => ({
      index: tile.index,
      style: {
        'inset-inline-start': `calc((100% + var(--np-gap)) * ${round(tile.x, 5)})`,
        top: `calc((100% + var(--np-gap)) * ${round(tile.y, 5)})`,
        width: `calc((100% + var(--np-gap)) * ${round(tile.width, 5)} - var(--np-gap))`,
        height: `calc((100% + var(--np-gap)) * ${round(tile.height, 5)} - var(--np-gap))`,
      },
      ...(hidden > 0 && position === tiles.length - 1 ? { more: hidden } : {}),
    }))
  } else {
    items = photos.map((photo, index): AlbumPlanItem => ({
      index,
      style:
        type === 'grid'
          ? {}
          : {
              '--np-open': String(
                round(computeAccordionGrow(photo.width / photo.height, ratio, photos.length), 4),
              ),
            },
    }))
  }
  const shareAt = (columns: number): number[] => {
    if (type === 'bento') return bentoShares.get(columns)!
    if (type === 'grid') return items.map(() => 1 / columns)
    if (type === 'mosaic') return mosaicShares
    // An accordion slice shows its photo at the open width.
    return items.map((item) => {
      const grow = Number(item.style['--np-open'])
      return grow / (grow + photos.length - 1)
    })
  }
  const widths = spans.map((span) => ({ start: span.start, shares: shareAt(span.columns) }))
  const order = items.map((item) => item.index)
  if (type === 'mosaic') {
    const shown = new Set(order)
    photos.forEach((_, index) => {
      if (!shown.has(index)) order.push(index)
    })
  }
  return { css, frameStyle, items, order, widths }
}
