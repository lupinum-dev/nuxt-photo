import {
  resolveResponsiveValue,
  type ResolvedPhotoItem as PhotoItem,
  type ResponsiveParameter,
} from '../../types'
import { devWarn } from '../../env'
import { round } from '../../utils/math'
import {
  DEFAULT_BREAKPOINTS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  computeGaps,
} from '../constants'
import { containerQueryCss, planWidths, type AlbumPlan, type AlbumPlanWidths } from '../plan'
import { computeRowsLayout } from './index'

/** Row breaks of a previous plan, so appended photos never re-break rows already shown. */
export type RowBreakMemo = {
  photos: string[]
  /** Per planned width: the settings used and the exclusive end index of each row. */
  widths: Map<number, { settings: string; ends: number[] }>
}

export type RowsPlan = AlbumPlan & { memo: RowBreakMemo }

/**
 * Plan a justified rows album that CSS alone positions at every container width.
 *
 * Rows are solved once per planned width (the breakpoints, else the default
 * ladder). The width covers its range up to the next one; the first also covers
 * every smaller width. Each item grows from zero by its aspect ratio, so a row
 * fills the width at one shared height whatever the actual width is; the CSS only
 * switches on the line break after each row's last item. Neighbouring widths with
 * the same breaks and gaps merge into one container query.
 *
 * Pass the previous plan's `memo`: when the new photos only append to the old
 * ones, each width keeps its rows and solves only the photos after them.
 */
export function computeRowsPlan<TMeta extends object>(
  options: {
    photos: readonly PhotoItem<TMeta>[]
    containerName: string
    breakpoints?: readonly number[]
    spacing?: ResponsiveParameter<number>
    padding?: ResponsiveParameter<number>
    targetRowHeight?: ResponsiveParameter<number>
  },
  previous?: RowBreakMemo,
): RowsPlan {
  const { photos, containerName } = options
  const ids = photos.map((photo) => `${photo.id}/${photo.width}/${photo.height}`)
  const memo: RowBreakMemo = { photos: ids, widths: new Map() }
  if (!photos.length) {
    return { css: '', frameStyle: {}, items: [], order: [], widths: [], memo }
  }
  const appended =
    previous !== undefined &&
    previous.photos.length <= ids.length &&
    previous.photos.every((id, index) => id === ids[index])
  const ratios = photos.map((photo) => photo.width / photo.height)

  const spans: (AlbumPlanWidths & { rules: string })[] = []
  for (const width of planWidths(options.breakpoints, DEFAULT_BREAKPOINTS)) {
    const spacing = round(resolveResponsiveValue(options.spacing, width, DEFAULT_SPACING), 3)
    const padding = round(resolveResponsiveValue(options.padding, width, DEFAULT_PADDING), 3)
    const targetRowHeight = resolveResponsiveValue(
      options.targetRowHeight,
      width,
      DEFAULT_TARGET_ROW_HEIGHT,
    )
    const settings = `${spacing}/${padding}/${targetRowHeight}`
    const kept = appended ? previous.widths.get(width) : undefined
    const ends = kept?.settings === settings ? [...kept.ends] : []
    const offset = ends.at(-1) ?? 0
    if (offset < photos.length) {
      const rows = computeRowsLayout({
        photos: photos.slice(offset),
        containerWidth: width,
        spacing,
        padding,
        targetRowHeight,
      })
      if (!rows.length) continue
      for (const row of rows) ends.push(offset + row.entries.at(-1)!.index + 1)
    }
    memo.widths.set(width, { settings, ends })

    const breaks = ends
      .slice(0, -1)
      .map((end) => `.np-br-${end - 1}`)
      .join(',')
    const rules =
      `.np-album__frame{--np-gap:${spacing}px;--np-padding:${padding}px}` +
      (breaks ? `${breaks}{display:block}` : '')
    if (spans.at(-1)?.rules === rules) continue

    const shares: number[] = []
    const gaps: number[] = []
    let start = 0
    for (const end of ends) {
      const sum = ratios.slice(start, end).reduce((total, value) => total + value, 0)
      const rowGaps = computeGaps(spacing, padding, end - start)
      for (let index = start; index < end; index++) {
        shares.push(ratios[index]! / sum)
        gaps.push(rowGaps)
      }
      start = end
    }
    spans.push({ start: spans.length ? width : 0, rules, shares, gaps })
  }
  if (!spans.length) {
    devWarn(
      'rows layout is empty at every planned width. Check that spacing and padding leave room for photos at the smallest breakpoint.',
    )
  }

  // A flex line whose grow factors sum below 1 leaves part of the width empty
  // (one portrait photo in a row), so the narrowest photo grows by exactly 1.
  const narrowest = Math.min(...ratios)
  return {
    css: containerQueryCss(containerName, spans),
    frameStyle: {},
    items: photos.map((_, index) => ({
      index,
      style: { 'flex-grow': String(round(ratios[index]! / narrowest, 5)) },
      ...(index < photos.length - 1 ? { breakClass: `np-br-${index}` } : {}),
    })),
    order: photos.map((_, index) => index),
    widths: spans.map(({ start, shares, gaps }) => ({ start, shares, gaps })),
    memo,
  }
}
