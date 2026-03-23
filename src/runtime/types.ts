import type { HTMLAttributes, ImgHTMLAttributes, Ref } from 'vue'
import type {
  LightboxController as InternalLightboxController,
  LightboxControllerHooks as InternalLightboxControllerHooks,
  LightboxControllerState as InternalLightboxControllerState,
  LightboxCustomItem as InternalLightboxCustomItem,
  LightboxCustomSlideRender as InternalLightboxCustomSlideRender,
  LightboxDOMBinding as InternalLightboxDOMBinding,
  LightboxImageItem as InternalLightboxImageItem,
  LightboxOpenParams as InternalLightboxOpenParams,
  Point as InternalPoint,
} from './lightbox/types'

/** Supported album layout modes. */
export const LayoutTypes = ['rows', 'columns', 'masonry'] as const
/** Supported caption visibility modes for standalone images. */
export const CaptionVisibilityModes = ['none', 'below', 'lightbox', 'both'] as const

export type LayoutType = (typeof LayoutTypes)[number]
export type CaptionVisibilityMode = (typeof CaptionVisibilityModes)[number]

export type ImageModifierValue = string | number | boolean | undefined
export type ImageModifiers = Record<string, ImageModifierValue>

/** Base image record shared by albums, standalone images, and lightbox items. */
export interface PhotoItem {
  key?: string | number
  src: string
  width: number
  height: number
  alt?: string
  caption?: string
  description?: string
  thumbnailSrc?: string
  href?: string
}

/** Shared image rendering options passed to `PhotoImage` / `NuxtImg`. */
export interface ImageConfig {
  preset?: string
  sizes?: string
  densities?: string
  modifiers?: ImageModifiers
  provider?: string
  fit?: string
  loading?: ImgHTMLAttributes['loading']
  decoding?: ImgHTMLAttributes['decoding']
  fetchpriority?: ImgHTMLAttributes['fetchpriority']
  placeholder?: boolean | string | number | number[]
}

/** Extra row-layout controls used by the justified rows algorithm. */
export interface RowConstraints {
  minPhotos?: number
  maxPhotos?: number
  singleRowMaxHeight?: number
}

/** Resolved-at-runtime layout settings before breakpoint flattening. */
export interface ResponsiveLayoutConfig {
  columns?: number
  spacing?: number
  padding?: number
  targetRowHeight?: number
  rowConstraints?: RowConstraints
}

/** Concrete layout settings after breakpoint resolution. */
export interface ResolvedResponsiveLayoutConfig {
  columns: number
  spacing: number
  padding: number
  targetRowHeight: number
  rowConstraints?: RowConstraints
}

/**
 * Public lightbox options used by the module surface.
 *
 * These names intentionally stay simpler than the internal runtime option names.
 * Translation into the internal runtime contract happens in `app/utils/lightbox.ts`.
 */
export interface LightboxOptions {
  loop?: boolean
  bgOpacity?: number
  closeOnVerticalDrag?: boolean
  pinchToClose?: boolean
  openAnimation?: 'zoom' | 'fade' | 'none'
  closeAnimation?: 'zoom' | 'fade' | 'none'
  showDuration?: number
  hideDuration?: number
  zoomDuration?: number
  imageClickAction?: 'zoom' | 'zoom-or-close' | 'close' | 'next' | 'toggle-ui' | false
  bgClickAction?: 'close' | 'next' | false
  tapAction?: 'toggle-ui' | 'close' | false
  doubleTapAction?: 'zoom' | 'close' | false
  escKey?: boolean
  arrowKeys?: boolean
  trapFocus?: boolean
  returnFocus?: boolean
  preload?: [number, number]
  imagePreset?: string
  maxImageWidth?: number
  debug?: boolean
  getViewportSizeFn?: (...args: unknown[]) => { x: number, y: number }
}

/** Enables default lightbox behavior, disables it entirely, or provides per-instance options. */
export type LightboxConfig = boolean | LightboxOptions

/** Lightbox image record used by `PhotoGallery`, `PhotoLightbox`, and grouped `PhotoImg` flows. */
export interface LightboxImageItem extends PhotoItem, Omit<InternalLightboxImageItem, 'src' | 'width' | 'height' | 'alt'> {
  type?: 'image'
  id?: string | number
  msrc?: string
  srcset?: string
}

export type LightboxCustomItem = InternalLightboxCustomItem
export type LightboxItem = LightboxImageItem | LightboxCustomItem

export type PhotoPoint = InternalPoint
export type PhotoLightboxDOMBinding = InternalLightboxDOMBinding
export type LightboxOpenParams = InternalLightboxOpenParams
export type LightboxController = InternalLightboxController
export type LightboxControllerState = InternalLightboxControllerState
export type LightboxControllerHooks = InternalLightboxControllerHooks
export type LightboxCustomSlideRender = InternalLightboxCustomSlideRender

/** Module-level defaults for generating lightbox image URLs through `@nuxt/image`. */
export interface LightboxModuleConfig {
  preset?: string
  maxWidth?: number
  densities?: string
}

/** Generic item/layout pair used by the layout utilities. */
export interface LayoutEntry<T extends PhotoItem = PhotoItem> {
  item: T
  layout: InternalLayoutMetrics
}

/** Shared layout math input used by all layout strategies. */
export interface CommonLayoutOptions {
  spacing: number
  padding: number
  containerWidth: number
}

/** Concrete input for the justified rows layout strategy. */
export interface RowsLayoutOptions extends CommonLayoutOptions {
  layout: Extract<LayoutType, 'rows'>
  targetRowHeight: number
  rowConstraints?: RowConstraints
}

/** Concrete input for balanced columns and masonry layouts. */
export interface ColumnsLayoutOptions extends CommonLayoutOptions {
  layout: Extract<LayoutType, 'columns' | 'masonry'>
  columns: number
}

export type LayoutOptions = RowsLayoutOptions | ColumnsLayoutOptions

export interface InternalLayoutMetrics {
  width: number
  height: number
  index: number
  positionIndex: number
  itemsCount: number
}

/** Layout metadata exposed to album slots. */
export type PhotoLayoutItem = InternalLayoutMetrics & {
  mode: LayoutType
  columnIndex?: number
  rowIndex?: number
}

/** Loose render-prop object forwarded to `PhotoImage`. */
export type PhotoImageProps = Record<string, unknown>

/** Slot payload for `PhotoAlbum` photo slots. */
export interface PhotoSlotContext<T extends PhotoItem = PhotoItem> {
  item: T
  index: number
  layout: PhotoLayoutItem
  imageProps: PhotoImageProps
  selected: boolean
  open: (event?: MouseEvent) => Promise<boolean | undefined>
}

/** Interaction payload emitted when a rendered album photo is clicked. */
export interface PhotoInteractionPayload<T extends PhotoItem = PhotoItem> {
  item: T
  index: number
  layout: PhotoLayoutItem
}

/** Event contract for `PhotoAlbum`. */
export interface PhotoAlbumEmits<T extends PhotoItem = PhotoItem> {
  'click': [PhotoInteractionPayload<T>]
  'update:lightbox-index': [number | null]
  'lightbox-open': [{ item: T, index: number }]
  'lightbox-close': []
}

export type ResponsiveProp<T> = T | Record<number, T>

/** Public props for `PhotoAlbum`. */
export interface PhotoAlbumProps<T extends PhotoItem = PhotoItem> {
  items: T[]
  layout: LayoutType
  columns?: ResponsiveProp<number>
  spacing?: ResponsiveProp<number>
  padding?: ResponsiveProp<number>
  targetRowHeight?: ResponsiveProp<number>
  rowConstraints?: RowConstraints
  containerWidth?: number
  defaultContainerWidth?: number
  image?: ImageConfig
  lightbox?: LightboxConfig
  lightboxIndex?: number | null
  photoClass?: HTMLAttributes['class']
  imageClass?: HTMLAttributes['class']
}

/** A fully prepared album entry with layout metadata and image props attached. */
export interface PhotoLayoutEntry<T extends PhotoItem = PhotoItem> {
  item: T
  index: number
  layout: PhotoLayoutItem
  imageProps: PhotoImageProps
}

/** A rendered row or column group produced by `usePhotoAlbumLayout`. */
export interface PhotoLayoutGroup<T extends PhotoItem = PhotoItem> {
  type: 'row' | 'column'
  index: number
  entries: PhotoLayoutEntry<T>[]
  columnsGaps?: number[]
  columnsRatios?: number[]
}

/** Internal props for the default album photo renderer. */
export interface PhotoAlbumPhotoProps<T extends PhotoItem = PhotoItem> {
  item: T
  layout: PhotoLayoutItem
  layoutOptions: LayoutOptions
  imageProps: PhotoImageProps
  selected: boolean
  interactive: boolean
  photoClass?: HTMLAttributes['class']
}

/** Input contract for `usePhotoAlbumLayout`. */
export interface UsePhotoAlbumLayoutOptions<T extends PhotoItem = PhotoItem> {
  items: () => T[]
  layout: () => LayoutType
  columns?: () => ResponsiveProp<number> | undefined
  spacing?: () => ResponsiveProp<number> | undefined
  padding?: () => ResponsiveProp<number> | undefined
  targetRowHeight?: () => ResponsiveProp<number> | undefined
  rowConstraints?: () => RowConstraints | undefined
  containerWidth?: () => number | undefined
  defaultContainerWidth?: () => number | undefined
  image?: () => ImageConfig | undefined
  imageClass?: () => HTMLAttributes['class'] | undefined
}

/** Public config for `usePhotoLightbox`. */
export interface UsePhotoLightboxConfig {
  items: Ref<readonly LightboxItem[]> | readonly LightboxItem[]
  options?: Ref<LightboxOptions | undefined> | LightboxOptions | (() => LightboxOptions | undefined)
  getThumbnailElement?: Ref<((index: number, item: LightboxItem) => HTMLElement | null | undefined) | undefined>
    | ((index: number, item: LightboxItem) => HTMLElement | null | undefined)
    | (() => ((index: number, item: LightboxItem) => HTMLElement | null | undefined) | undefined)
  image?: Ref<ImageConfig | undefined> | ImageConfig | (() => ImageConfig | undefined)
}

/** Shared controls-slot payload used by every lightbox-capable component. */
export interface LightboxControlsSlotProps {
  controller: LightboxController
  state: LightboxControllerState
  options: LightboxOptions | undefined
  open: (
    index?: number,
    options?: LightboxOptions,
    sourceElement?: HTMLElement | null,
    initialPointerPos?: PhotoPoint | null,
  ) => boolean
  close: () => void
  next: () => void
  prev: () => void
  toggleZoom: () => void
  setUiVisible: (isVisible: boolean) => void
}
