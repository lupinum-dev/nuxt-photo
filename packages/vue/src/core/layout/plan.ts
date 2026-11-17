import { round } from '../utils/math'

/** One album item in DOM order. */
export type AlbumPlanItem = {
  /** Index into the album's `photos`. */
  index: number
  style: Record<string, string>
  className?: string
  /** Class of the line break rendered after the item; the plan's CSS shows it at a row end. */
  breakClass?: string
  /** Mosaic: photos left out after the last tile. */
  more?: number
}

/**
 * Item widths from container width `start` up: item `i` is
 * `(containerWidth - (gaps?.[i] ?? 0)) * shares[i]` wide.
 */
export type AlbumPlanWidths = { start: number; shares: number[]; gaps?: number[] }

/** Everything that positions a CSS layout: generated CSS plus per-item class and style. */
export type AlbumPlan = {
  css: string
  frameStyle: Record<string, string>
  items: AlbumPlanItem[]
  /** Photo indexes in navigation order. */
  order: number[]
  /** One entry per container width range; `shares[i]` belongs to `items[i]`. */
  widths: AlbumPlanWidths[]
}

/**
 * Widths to plan a layout at: the positive breakpoints, sorted. The default ladder
 * fills the range below the smallest one (all of it when there are none), so small
 * containers get their own layout and the values of a `responsive()` key 0 apply.
 */
export function planWidths(breakpoints: readonly number[] | undefined, ladder: readonly number[]) {
  const widths = [...new Set(breakpoints ?? [])]
    .filter((width) => Number.isFinite(width) && width > 0)
    .sort((a, b) => a - b)
  return [...ladder.filter((width) => width < (widths[0] ?? Infinity)), ...widths]
}

/**
 * Wrap each span's rules in a container query of the album. Spans are sorted, already
 * merged, and each holds from its `start` to the next span's; the first has no lower bound.
 */
export function containerQueryCss(
  containerName: string,
  spans: readonly { start: number; rules: string }[],
): string {
  return spans
    .map((span, index) => {
      const end = spans[index + 1]?.start
      const condition =
        spans.length === 1
          ? ''
          : index === 0
            ? ` (width < ${end}px)`
            : end === undefined
              ? ` (width >= ${span.start}px)`
              : ` (width >= ${span.start}px) and (width < ${end}px)`
      return `@container ${containerName}${condition}{${span.rules}}`
    })
    .join('\n')
}

/** `a` times the album width plus `b` pixels, as CSS (`100cqi` is the album width). */
export function containerLength(a: number, b: number): string {
  return `calc(${round(a * 100, 5)}cqi + ${round(b, 3)}px)`
}

/**
 * The rules every width of a columns or masonry album shares, scoped to the album: each item
 * sits absolutely in a content box of width `--np-w`, and `place` sets its top and inline
 * start; `extra` holds more rules for the same album. Living in the plan, they load only
 * with an album that uses these layouts.
 */
export function absoluteItemsCss(containerName: string, place: string, extra = ''): string {
  return (
    `\n@container ${containerName}{` +
    '.np-album__frame{position:relative;--np-step:calc(2*var(--np-padding,0px) + var(--np-gap,8px))}' +
    '.np-album__frame .np-album__item{position:absolute;box-sizing:content-box;' +
    `width:var(--np-w);padding:var(--np-padding,0px);${place}}${extra}}`
  )
}
