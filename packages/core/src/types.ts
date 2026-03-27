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
  photos: PhotoItem<any>[]
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

export type BentoSizing = 'auto' | 'pattern' | 'manual'

export type BentoLayoutOptions = LayoutInput & {
  columns?: number
  rowHeight?: number
  sizing?: BentoSizing
  patternInterval?: number
}

export type LayoutEntry = {
  index: number
  photo: PhotoItem
  width: number
  height: number
  positionIndex: number
  itemsCount: number
  colSpan?: number
  rowSpan?: number
}

export type LayoutGroup = {
  type: 'row' | 'column' | 'grid'
  index: number
  entries: LayoutEntry[]
  columnsGaps?: number[]
  columnsRatios?: number[]
}

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

export type ImageAdapter = (photo: PhotoItem<any>, context: ImageContext) => ImageSource

// ─── Responsive parameters ───

/**
 * A prop value that can be a plain number or a function that receives the current
 * container width and returns a number. Allows per-breakpoint customisation without
 * needing explicit breakpoint arrays.
 *
 * @example
 * // static
 * spacing={8}
 * // responsive
 * spacing={(w) => w < 600 ? 4 : 8}
 */
export type ResponsiveParameter<T = number> = T | ((containerWidth: number) => T)

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

// ─── Debug ───

export type DebugChannel = 'transitions' | 'gestures' | 'zoom' | 'slides' | 'geometry' | 'rects'
