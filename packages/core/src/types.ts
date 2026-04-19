// ─── Item types ───

export type PhotoItem<TMeta extends Record<string, unknown> = Record<string, unknown>> = {
  id: string | number
  src: string
  thumbSrc?: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  blurhash?: string
  srcset?: string
  meta?: TMeta
}

/** Normalize photo id to string for reliable comparison across string/number types. */
export function photoId(photo: PhotoItem): string {
  return String(photo.id)
}

export type SlideItem =
  | { type: 'image'; photo: PhotoItem }
  | { type: 'custom'; id: string; data?: unknown; width?: number; height?: number }

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

export type GestureMode = 'idle' | 'slide' | 'pan' | 'close'

// ─── Panzoom motion ───

export type PanzoomMotion = {
  x: number
  y: number
  scale: number
  targetX: number
  targetY: number
  targetScale: number
  velocityX: number
  velocityY: number
  velocityScale: number
  tension: number
  friction: number
  rafId: number
}

// ─── Carousel ───

export type CarouselStyle = 'classic' | 'parallax' | 'fade'

export type CarouselConfig = {
  style: CarouselStyle
  parallax: { amount: number; scale: number; opacity: number }
  fade: { minOpacity: number }
}

// ─── Viewer state machine ───

export type ViewerState =
  | { status: 'closed' }
  | { status: 'opening'; activeId: string | number }
  | { status: 'open'; activeId: string | number }
  | { status: 'closing'; activeId: string | number }

// ─── Transition ───

export type TransitionMode = 'flip' | 'fade' | 'auto' | 'none'

export type OpenTransitionPlan = {
  mode: 'connected' | 'fade' | 'scale-fade'
  sourceRect?: RectLike
  targetRect?: RectLike
  sourceAspectRatio?: number
  targetAspectRatio?: number
  durationMs: number
  easing: string
  reason?:
    | 'ok'
    | 'missing-source'
    | 'not-visible'
    | 'bad-geometry'
    | 'aspect-ratio-too-far'
    | 'decode-timeout'
    | 'reduced-motion'
}

export type CloseTransitionPlan = {
  mode: 'flip' | 'fade' | 'instant'
  fromRect?: RectLike
  toRect?: RectLike
  durationMs: number
  reason:
    | 'ok'
    | 'missing-thumb-ref'
    | 'thumb-off-screen'
    | 'missing-frame-rect'
    | 'mode-forced-fade'
    | 'mode-forced-none'
    | 'visibility-below-threshold'
    | 'scrolled-into-view'
}

// ─── Layout ───

export type LayoutInput = {
  photos: PhotoItem[]
  containerWidth: number
  spacing?: number
  padding?: number
}

export type RowsLayoutOptions = LayoutInput & {
  targetRowHeight?: number
}

export type ColumnsLayoutOptions = LayoutInput & {
  columns?: number
}

export type MasonryLayoutOptions = LayoutInput & {
  columns?: number
}

export type LayoutEntry = {
  index: number
  photo: PhotoItem
  width: number
  height: number
  positionIndex: number
  itemsCount: number
}

export type LayoutGroup = {
  type: 'row' | 'column'
  index: number
  entries: LayoutEntry[]
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

// ─── Image adapter ───

export type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}

/**
 * Context in which an image is being rendered.
 * - `'thumb'` — grid thumbnail (smaller, responsive srcset)
 * - `'slide'` — lightbox slide (full-viewport srcset)
 * - `'preload'` — reserved for future preloading support; adapters may return a
 *   single low-res URL here. The native adapter treats it the same as `'slide'`.
 */
export type ImageContext = 'thumb' | 'slide' | 'preload'

export type ImageAdapter = (photo: PhotoItem, context: ImageContext) => ImageSource

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
export function resolveResponsiveParameter<T>(
  value: ResponsiveParameter<T> | undefined,
  containerWidth: number,
  fallback: T,
): T {
  if (value === undefined) return fallback
  return typeof value === 'function' ? (value as (w: number) => T)(containerWidth) : value
}

export function getResponsiveBreakpoints<T>(
  value: ResponsiveParameter<T> | undefined,
): readonly number[] | undefined {
  if (typeof value !== 'function') return undefined

  const breakpoints = (value as ResponsiveResolver<T>)[responsiveBreakpointsKey]
  return Array.isArray(breakpoints) && breakpoints.length > 0 ? breakpoints : undefined
}

export function mergeResponsiveBreakpoints(
  values: Array<ResponsiveParameter<any> | undefined>,
): readonly number[] | undefined {
  const positive = new Set<number>()
  let sawZeroBreakpoint = false

  for (const value of values) {
    const breakpoints = getResponsiveBreakpoints(value)
    if (!breakpoints) continue

    for (const breakpoint of breakpoints) {
      if (!Number.isFinite(breakpoint) || breakpoint < 0) continue
      if (breakpoint === 0) {
        sawZeroBreakpoint = true
        continue
      }
      positive.add(breakpoint)
    }
  }

  if (positive.size === 0) return undefined

  const merged = [...positive].sort((a, b) => a - b)
  if (!sawZeroBreakpoint) return merged

  const floor = Math.max(1, Math.floor(merged[0]! / 2))
  return merged[0] === floor ? merged : [floor, ...merged]
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

  const resolver = ((containerWidth: number) => {
    for (const [minWidth, value] of sorted) {
      if (containerWidth >= minWidth) return value
    }
    return sorted[sorted.length - 1]![1]
  }) as ResponsiveResolver<T>

  Object.defineProperty(resolver, responsiveBreakpointsKey, {
    value: [...new Set(sorted.map(([minWidth]) => minWidth).filter(width => Number.isFinite(width) && width >= 0))].sort((a, b) => a - b),
    enumerable: false,
    configurable: false,
    writable: false,
  })

  return resolver
}

// ─── Photo adapter ───

/**
 * Transforms external data shapes into `PhotoItem`.
 * Pass to `PhotoAlbum` or `PhotoGroup` via the `:photoAdapter` prop so you can
 * feed CMS / API responses directly without manual mapping.
 *
 * @example
 * const fromUnsplash: PhotoAdapter<UnsplashPhoto> = (item) => ({
 *   id: item.id,
 *   src: item.urls.regular,
 *   thumbSrc: item.urls.thumb,
 *   width: item.width,
 *   height: item.height,
 *   alt: item.alt_description ?? undefined,
 * })
 */
export type PhotoAdapter<T = any> = (item: T) => PhotoItem

// ─── Debug ───

export type DebugChannel = 'transitions' | 'gestures' | 'zoom' | 'slides' | 'geometry' | 'rects'
