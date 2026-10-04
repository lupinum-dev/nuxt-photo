// ─── Item types ───

/**
 * One photo. Every component accepts this shape.
 * @see https://nuxt-photo.lupinum.com/docs/reference/types
 */
export interface PhotoItem<TMeta extends object = Readonly<Record<string, unknown>>> {
  /** Stable, unique identity. Use the ID from your CMS or database, not the array index. */
  readonly id: string
  /** Image URL. The lightbox uses it; thumbnails use it unless `thumbSrc` is set. */
  readonly src: string
  /** Smaller image URL for thumbnails, used by the native provider. */
  readonly thumbSrc?: string
  /** Low-quality preview shown until the image loads. It stays visible if the image fails. */
  readonly placeholderSrc?: string
  /** Real pixel width of the image file, not its displayed size. Used for layout before load. */
  readonly width?: number
  /** Real pixel height of the image file, not its displayed size. Used for layout before load. */
  readonly height?: number
  /** Alternative text for the thumbnail and the lightbox image. */
  readonly alt?: string
  /** Short visible text, shown under the photo in the lightbox. */
  readonly caption?: string
  /** Longer visible text in the lightbox. */
  readonly description?: string
  /** Native `srcset` candidates, used by the native provider. */
  readonly srcset?: string
  /** Your own typed data, passed through to slots and providers. */
  readonly meta?: Readonly<TMeta>
}

/** Internal photo shape after dimension validation. */
export interface ResolvedPhotoItem<
  TMeta extends object = Readonly<Record<string, unknown>>,
> extends PhotoItem<TMeta> {
  readonly width: number
  readonly height: number
}

// ─── Geometry ───

export type RectLike = {
  left: number
  top: number
  width: number
  height: number
}

export type AreaMetrics = RectLike

export type PanState = {
  x: number
  y: number
}

export type PanBounds = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// ─── Zoom ───

export type ZoomState = {
  fit: number
  secondary: number
  max: number
  current: number
}

// ─── Gestures ───

export type GestureMode = 'idle' | 'slide' | 'pan' | 'pinch' | 'close'

// ─── Transition ───

export type TransitionMode = 'flip' | 'fade' | 'auto' | 'none'

/**
 * How the lightbox changes from one photo to the next.
 * - `'slide'` — photos sit on a strip that follows the finger (default)
 * - `'fade'` — the current photo fades out, then the next fades in
 * - `'crossfade'` — the next photo fades in over the current one
 */
export type LightboxNavigationMode = 'slide' | 'fade' | 'crossfade'

export type LightboxTransitionOption =
  | TransitionMode
  | {
      mode: TransitionMode
      autoThreshold?: number
    }

export type CloseTransitionPlan = {
  mode: 'flip' | 'fade' | 'instant'
  fromRect?: RectLike
  toRect?: RectLike
  durationMs: number
}

// ─── Layout ───

export type LayoutInput<TMeta extends object = Readonly<Record<string, unknown>>> = {
  photos: readonly ResolvedPhotoItem<TMeta>[]
  containerWidth: number
  spacing?: number
  padding?: number
}

export type RowsLayoutOptions<TMeta extends object = Readonly<Record<string, unknown>>> =
  LayoutInput<TMeta> & {
    targetRowHeight?: number
  }

export type ColumnsLayoutOptions<TMeta extends object = Readonly<Record<string, unknown>>> =
  LayoutInput<TMeta> & {
    columns?: number
  }

export type MasonryLayoutOptions<TMeta extends object = Readonly<Record<string, unknown>>> =
  LayoutInput<TMeta> & {
    columns?: number
  }

export type LayoutEntry<TMeta extends object = Readonly<Record<string, unknown>>> = {
  index: number
  photo: ResolvedPhotoItem<TMeta>
  width: number
  height: number
  positionIndex: number
  itemsCount: number
}

export type LayoutGroup<TMeta extends object = Readonly<Record<string, unknown>>> = {
  type: 'row' | 'column'
  index: number
  entries: LayoutEntry<TMeta>[]
  columnsGaps?: number[]
  columnsRatios?: number[]
}

// ─── Album layout (discriminated union for PhotoAlbum) ───

export type RowsAlbumLayout = {
  type: 'rows'
  targetRowHeight?: ResponsiveParameter<number>
}

export type ColumnsAlbumLayout = {
  type: 'columns'
  columns?: ResponsiveParameter<number>
}

export type MasonryAlbumLayout = {
  type: 'masonry'
  columns?: ResponsiveParameter<number>
}

/**
 * Discriminated layout config for `PhotoAlbum`.
 * Each variant only accepts the props relevant to that layout type.
 *
 * @example
 * <PhotoAlbum :photos="photos" :layout="{ type: 'rows', targetRowHeight: 280 }" />
 */
export type AlbumLayout = RowsAlbumLayout | ColumnsAlbumLayout | MasonryAlbumLayout

// ─── Carousel ───

export interface PhotoCarouselAutoplayOptions {
  readonly delayMs?: number
  readonly stopOnInteraction?: boolean
  readonly stopOnMouseEnter?: boolean
}

export type ResponsivePhotoSizes = {
  size: string
  sizes?: Array<{ viewport: string; size: string }>
}

// ─── Responsive parameters ───

/**
 * A prop value that can be a plain value or a function that receives the current
 * container width and returns a value. Allows per-breakpoint customisation without
 * needing explicit breakpoint arrays. Defaults to `number` but can be parameterized.
 *
 * @example
 * // Static value — same at every container width
 * :spacing="8"
 *
 * // Inline function — full control
 * :spacing="(w) => w < 600 ? 4 : 8"
 *
 * // Breakpoint map via responsive() helper — declarative shorthand
 * :spacing="responsive({ 0: 4, 600: 8, 900: 12 })"
 */
export type ResponsiveParameter<T = number> = T | ((containerWidth: number) => T)

const responsiveBreakpointsKey = Symbol('nuxt-photo:responsive-breakpoints')

export type ResponsiveResolver<T> = ((containerWidth: number) => T) & {
  readonly [responsiveBreakpointsKey]?: readonly number[]
}

/**
 * Resolve a `ResponsiveParameter` to its concrete value.
 * Returns `fallback` when `value` is `undefined`.
 */
export function resolveResponsiveValue<T>(
  value: ResponsiveParameter<T> | undefined,
  containerWidth: number,
  fallback: T,
): T {
  if (!Number.isFinite(containerWidth)) {
    throw new RangeError('[nuxt-photo] container width must be finite')
  }
  if (value === undefined) return fallback
  return typeof value === 'function' ? (value as (w: number) => T)(containerWidth) : value
}

/** Read breakpoint metadata from a `responsive()` resolver when present. */
export function getResponsiveBreakpoints<T>(
  value: ResponsiveParameter<T> | undefined,
): readonly number[] | undefined {
  if (typeof value !== 'function') return undefined

  const breakpoints = (value as ResponsiveResolver<T>)[responsiveBreakpointsKey]
  return Array.isArray(breakpoints) && breakpoints.length > 0 ? breakpoints : undefined
}

/** Merge breakpoint metadata from several responsive parameters into one list. */
export function mergeResponsiveBreakpoints(
  values: ReadonlyArray<ResponsiveParameter<unknown> | undefined>,
): readonly number[] | undefined {
  const positive = new Set<number>()

  for (const value of values) {
    const breakpoints = getResponsiveBreakpoints(value)
    if (!breakpoints) continue

    for (const breakpoint of breakpoints) {
      if (!Number.isFinite(breakpoint) || breakpoint < 0) continue
      if (breakpoint === 0) continue
      positive.add(breakpoint)
    }
  }

  if (positive.size === 0) return undefined

  return [...positive].sort((a, b) => a - b)
}

/**
 * Create a responsive parameter from a breakpoint map.
 * Keys are minimum container widths (px); values are the parameter at that width.
 * The largest matching breakpoint wins (mobile-first).
 *
 * @example
 * // 2 columns below 600px, 3 at 600-899px, 4 at 900px+
 * responsive({ 0: 2, 600: 3, 900: 4 })
 *
 * @example
 * // Use with PhotoAlbum
 * <PhotoAlbum
 *   :layout="{ type: 'columns', columns: responsive({ 0: 2, 768: 3, 1200: 4 }) }"
 *   :spacing="responsive({ 0: 4, 768: 8, 1200: 12 })"
 * />
 */
export function responsive<T>(breakpoints: Record<number, T>): ResponsiveResolver<T> {
  const sorted = Object.entries(breakpoints)
    .map(([k, v]) => [Number(k), v] as [number, T])
    .sort((a, b) => b[0] - a[0])

  if (sorted.length === 0) {
    throw new Error('[nuxt-photo] responsive() requires at least one breakpoint')
  }

  const invalidBreakpoint = sorted.find(([minWidth]) => !Number.isFinite(minWidth) || minWidth < 0)
  if (invalidBreakpoint) {
    throw new RangeError(
      `[nuxt-photo] responsive() breakpoint "${String(invalidBreakpoint[0])}" must be a finite, non-negative number`,
    )
  }

  const resolver = ((containerWidth: number) => {
    if (!Number.isFinite(containerWidth)) {
      throw new RangeError('[nuxt-photo] responsive() container width must be finite')
    }
    for (const [minWidth, value] of sorted) {
      if (containerWidth >= minWidth) return value
    }
    return sorted[sorted.length - 1]![1]
  }) as ResponsiveResolver<T>

  Object.defineProperty(resolver, responsiveBreakpointsKey, {
    value: [
      ...new Set(
        sorted
          .map(([minWidth]) => minWidth)
          .filter((width) => Number.isFinite(width) && width >= 0),
      ),
    ].sort((a, b) => a - b),
    enumerable: false,
    configurable: false,
    writable: false,
  })

  return resolver
}
