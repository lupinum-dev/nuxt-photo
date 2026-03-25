// ─── Item types ───

export type PhotoItem = {
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
  meta?: Record<string, unknown>
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

// ─── Layout ───

export type LayoutItem = {
  index: number
  photo: PhotoItem
  left: number
  top: number
  width: number
  height: number
}

export type LayoutOutput = {
  items: LayoutItem[]
  containerHeight: number
}

export interface AlbumLayoutAdapter {
  name: string
  compute(input: LayoutInput): LayoutOutput
}

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

// ─── Grouped layout (flexbox / SSR-proof) ───

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

export type GroupedLayoutOptions = {
  containerWidth: number
  spacing: number
  padding: number
  layout: 'rows' | 'columns' | 'masonry'
}

export type GroupedLayoutOutput = {
  groups: LayoutGroup[]
  layoutOptions: GroupedLayoutOptions
}

// ─── Image adapter ───

export type ImageSource = {
  src: string
  srcset?: string
  sizes?: string
  width?: number
  height?: number
}

export type ImageContext = 'thumb' | 'slide' | 'preload'

export type ImageAdapter = (photo: PhotoItem, context: ImageContext) => ImageSource

// ─── Debug ───

export type DebugChannel = 'transitions' | 'gestures' | 'zoom' | 'slides' | 'geometry' | 'rects'
