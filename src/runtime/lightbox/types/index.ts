import type { EventHookOn } from '../../utils/dom-helpers'
import type { Ref, ShallowRef } from 'vue'

export interface Point {
  x: number
  y: number
  id?: string | number
}

export interface Padding {
  top: number
  bottom: number
  left: number
  right: number
}

export interface Bounds {
  x: number
  y: number
  w: number
  innerRect?: { w: number, h: number, x: number, y: number }
}

export type TransitionPhase = 'open' | 'close'

export type TransitionFallbackReason
  = | 'duration-disabled'
    | 'missing-current-slide'
    | 'missing-thumb-bounds'
    | 'missing-placeholder'
    | 'missing-crop-container'
    | 'missing-holder-element'
    | 'insufficient-thumb-visibility'
    | 'missing-declared-dimensions'
    | 'missing-natural-dimensions'
    | 'aspect-ratio-mismatch'
    | 'open-fallback-sync'

export interface ThumbnailBoundsData {
  bounds?: Bounds
  visibleAreaRatio?: number
  thumbnail?: HTMLElement | null
}

export interface LightboxTransitionPreflight {
  thumbData: ThumbnailBoundsData
  sourceElement?: HTMLElement | null
  declaredDimensionsPresent: boolean
  hasUsableNaturalDimensions: boolean
  aspectRatioCompatible: boolean
  geometryReliable: boolean
  fallbackReason?: TransitionFallbackReason
}

export interface LightboxItemBase {
  id?: string | number
  thumbCropped?: boolean
  [key: string]: unknown
}

export interface LightboxImageItem extends LightboxItemBase {
  type?: 'image'
  src: string
  srcset?: string
  width: number
  height: number
  msrc?: string
  alt?: string
}

export interface LightboxCustomItem extends LightboxItemBase {
  type: 'custom'
  width?: number
  height?: number
}

export type LightboxItem = LightboxImageItem | LightboxCustomItem

export type ActionFn = (point: Point, originalEvent: PointerEvent) => void
export type ActionType = 'close' | 'next' | 'zoom' | 'zoom-or-close' | 'toggle-ui'
export type LightboxAnimationType = 'zoom' | 'fade' | 'none'
export type ZoomLevelOption = 'fit' | 'fill' | number | ((zoomLevelObject: ZoomLevelInstance) => number)

export interface ZoomLevelInstance {
  lightbox?: LightboxInstance
  options: LightboxOptions
  itemData: LightboxItem
  index: number
  panAreaSize: Point | null
  elementSize: Point | null
  fit: number
  fill: number
  vFill: number
  initial: number
  secondary: number
  max: number
  min: number
}

export interface LightboxOptions {
  bgOpacity?: number
  spacing?: number
  allowPanToNext?: boolean
  loop?: boolean
  wheelToZoom?: boolean
  pinchToClose?: boolean
  closeOnVerticalDrag?: boolean
  padding?: Padding
  paddingFn?: (viewportSize: Point, itemData: LightboxItem, index: number) => Padding
  hideAnimationDuration?: number | false
  showAnimationDuration?: number | false
  zoomAnimationDuration?: number | false
  easing?: string
  escKey?: boolean
  arrowKeys?: boolean
  trapFocus?: boolean
  returnFocus?: boolean
  clickToCloseNonZoomable?: boolean
  imageClickAction?: ActionType | ActionFn | false
  bgClickAction?: ActionType | ActionFn | false
  tapAction?: ActionType | ActionFn | false
  doubleTapAction?: ActionType | ActionFn | false
  getViewportSizeFn?: (options: LightboxOptions, lightbox: LightboxInstance) => Point
  errorMsg?: string
  preload?: [number, number]
  maxWidthToAnimate?: number
  openAnimationType?: LightboxAnimationType
  closeAnimationType?: LightboxAnimationType
  index?: number
  initialZoomLevel?: ZoomLevelOption
  secondaryZoomLevel?: ZoomLevelOption
  maxZoomLevel?: ZoomLevelOption
  mouseMovePan?: boolean
  initialPointerPos?: Point | null
  debug?: boolean | LightboxDebugOptions
  preloadFirstSlide?: boolean
}

export interface LightboxDebugOptions {
  traceEvents?: boolean | string[]
  traceListeners?: boolean
  traceState?: boolean
  traceDOM?: boolean
  traceSlides?: boolean
  traceWarnings?: boolean
}

export interface LightboxDOMBinding {
  element: HTMLDivElement
  bg: HTMLDivElement
  scrollWrap: HTMLElement
  container: HTMLDivElement
  itemHolders: [HTMLDivElement, HTMLDivElement, HTMLDivElement]
}

export interface ResolvedLightboxTransition {
  phase: TransitionPhase
  requestedMode: LightboxAnimationType
  resolvedMode: LightboxAnimationType
  gracefulFallback: boolean
  fallbackReason?: TransitionFallbackReason
  thumbBounds?: Bounds
  thumbVisibleAreaRatio?: number
  hasHolder: boolean
  hasThumbBounds: boolean
  hasThumbnail: boolean
  hasPlaceholder: boolean
  croppedZoomRequested: boolean
  mainScrollShifted: boolean
}

export interface LightboxOpenParams {
  index?: number
  options?: LightboxOptions
  initialPointerPos?: Point | null
  sourceElement?: HTMLElement | null
  domBinding?: LightboxDOMBinding
  openSource?: string
}

export interface PreparedLightboxOptions extends LightboxOptions {
  allowPanToNext: boolean
  spacing: number
  loop: boolean
  pinchToClose: boolean
  closeOnVerticalDrag: boolean
  hideAnimationDuration: number | false
  showAnimationDuration: number | false
  zoomAnimationDuration: number | false
  escKey: boolean
  arrowKeys: boolean
  trapFocus: boolean
  returnFocus: boolean
  maxWidthToAnimate: number
  clickToCloseNonZoomable: boolean
  imageClickAction: ActionType | ActionFn | false
  bgClickAction: ActionType | ActionFn | false
  tapAction: ActionType | ActionFn | false
  doubleTapAction: ActionType | ActionFn | false
  bgOpacity: number
  index: number
  errorMsg: string
  preload: [number, number]
  easing: string
  openAnimationType: LightboxAnimationType
  closeAnimationType: LightboxAnimationType
}

export type Axis = 'x' | 'y'
export type LoadState = 'idle' | 'loading' | 'loaded' | 'error'

export interface ItemHolder {
  el: HTMLDivElement
  slide?: SlideInstance
}

export interface PlaceholderInstance {
  element: HTMLImageElement | HTMLDivElement | null
  setDisplayedSize(width: number, height: number): void
  destroy(): void
}

export interface ContentInstance {
  instance: LightboxInstance
  data: LightboxItem
  index: number
  element?: HTMLImageElement | HTMLDivElement
  placeholder?: PlaceholderInstance
  slide?: SlideInstance
  displayedImageWidth: number
  displayedImageHeight: number
  width: number
  height: number
  isAttached: boolean
  hasSlide: boolean
  isDecoding: boolean
  state: LoadState
  type: string
  removePlaceholder(): void
  load(isLazy: boolean, reload?: boolean): void
  loadImage(isLazy: boolean): void
  setSlide(slide: SlideInstance): void
  onLoaded(): void
  onError(): void
  isLoading(): boolean
  isError(): boolean
  isImageContent(): boolean
  setDisplayedSize(width: number, height: number): void
  isZoomable(): boolean
  updateSrcsetSizes(): void
  usePlaceholder(): boolean
  lazyLoad(): void
  keepPlaceholder(): boolean
  destroy(): void
  displayError(): void
  append(): void
  activate(): void
  deactivate(): void
  remove(): void
  appendImage(): void
}

export interface SlideInstance {
  data: LightboxItem
  index: number
  lightbox: LightboxInstance
  isActive: boolean
  currentResolution: number
  panAreaSize: Point
  pan: Point
  isFirstSlide: boolean
  zoomLevels: ZoomLevelInstance & { update(w: number, h: number, panArea: Point): void }
  content: ContentInstance
  container: HTMLDivElement
  holderElement: HTMLElement | null
  currZoomLevel: number
  width: number
  height: number
  heavyAppended: boolean
  bounds: PanBoundsInstance
  prevDisplayedWidth: number
  prevDisplayedHeight: number
  setIsActive(isActive: boolean): void
  append(holderElement: HTMLElement): void
  load(): void
  appendHeavy(): void
  activate(): void
  deactivate(): void
  destroy(): void
  resize(): void
  updateContentSize(force?: boolean): void
  sizeChanged(width: number, height: number): boolean
  getPlaceholderElement(): HTMLImageElement | HTMLDivElement | null | undefined
  zoomTo(destZoomLevel: number, centerPoint?: Point, transitionDuration?: number | false, ignoreBounds?: boolean): void
  toggleZoom(centerPoint?: Point): void
  setZoomLevel(currZoomLevel: number): void
  calculateZoomToPanOffset(axis: Axis, point?: Point, prevZoomLevel?: number): number
  panTo(panX: number, panY: number): void
  isPannable(): boolean
  isZoomable(): boolean
  applyCurrentZoomPan(): void
  zoomAndPanToInitial(): void
  calculateSize(): void
  getCurrentTransform(): string
  _setResolution(newResolution: number): void
  _applyZoomTransform(x: number, y: number, zoom: number): void
}

export interface PanBoundsInstance {
  slide: SlideInstance
  currZoomLevel: number
  center: Point
  max: Point
  min: Point
  update(currZoomLevel: number): void
  reset(): void
  correctPan(axis: Axis, panOffset: number): number
}

export interface SharedAnimationProps {
  name?: string
  isPan?: boolean
  isMainScroll?: boolean
  onComplete?: () => void
  onFinish?: () => void
}

export interface SpringAnimationProps extends SharedAnimationProps {
  start: number
  end: number
  velocity: number
  dampingRatio?: number
  naturalFrequency?: number
  onUpdate: (value: number) => void
}

export interface CssAnimationProps extends SharedAnimationProps {
  target: HTMLElement
  duration?: number
  easing?: string
  transform?: string
  opacity?: string
}

export type AnimationProps = SpringAnimationProps | CssAnimationProps

export interface AnimationInstance {
  props: AnimationProps
  onFinish: () => void
  destroy(): void
}

export interface LightboxInstance {
  sessionId: number
  options: PreparedLightboxOptions
  initialTransitionPreflight?: LightboxTransitionPreflight
  resolvedOpenTransition?: ResolvedLightboxTransition
  offset: Point
  viewportSize: Point
  bgOpacity: number
  currIndex: number
  potentialIndex: number
  isOpen: boolean
  isDestroying: boolean
  uiVisible: boolean
  hasMouse: boolean
  element?: HTMLDivElement
  template?: HTMLDivElement
  container?: HTMLDivElement
  scrollWrap?: HTMLElement
  bg?: HTMLDivElement
  domBinding?: LightboxDOMBinding
  createdDOM: boolean
  currSlide?: SlideInstance
  events: DOMEventsInstance
  animations: AnimationsInstance
  mainScroll: MainScrollInstance
  gestures: GesturesInstance
  opener: OpenerInstance
  keyboard: KeyboardInstance
  contentLoader: ContentLoaderInstance
  scrollWheel?: ScrollWheelInstance
  dispatch<T extends string>(name: T, details?: Record<string, unknown>): LightboxEvent<T>
  on<T extends string>(name: T, fn: (event: LightboxEvent<T>) => void): void
  off<T extends string>(name: T, fn: (event: LightboxEvent<T>) => void): void
  applyFilters<T extends string>(name: T, ...args: unknown[]): unknown
  addFilter<T extends string>(name: T, fn: (...args: unknown[]) => unknown, priority?: number): void
  removeFilter<T extends string>(name: T, fn: (...args: unknown[]) => unknown): void
  init(): boolean
  getNumItems(): number
  getItemData(index: number): LightboxItem
  getLoopedIndex(index: number): number
  canLoop(): boolean
  goTo(index: number): void
  next(): void
  prev(): void
  zoomTo(...args: Parameters<SlideInstance['zoomTo']>): void
  toggleZoom(): void
  close(): void
  destroy(): void
  refreshSlideContent(slideIndex: number): void
  setContent(holder: ItemHolder, index: number, force?: boolean): void
  getViewportCenterPoint(): Point
  updateSize(force?: boolean): void
  applyBgOpacity(opacity: number): void
  mouseDetected(): void
  setUIVisible(isVisible: boolean): void
  setScrollOffset(x: number, y: number): void
  appendHeavy(): void
  syncItems(): void
  getThumbBounds(): Bounds | undefined
  getThumbnailElement(index: number, itemData: LightboxItem): HTMLElement | null | undefined
  createContentFromData(slideData: LightboxItem, index: number): ContentInstance
}

export interface LightboxCustomSlideRender {
  index: number
  item: LightboxCustomItem
  slide: SlideInstance
  target: HTMLDivElement
  isActive: boolean
}

export interface LightboxController {
  options: Readonly<Ref<PreparedLightboxOptions>>
  items: Readonly<ShallowRef<readonly LightboxItem[]>>
  state: LightboxControllerState
  hooks: LightboxControllerHooks
  open(params?: LightboxOpenParams): boolean
  close(): void
  destroy(): void
  next(): void
  prev(): void
  zoomTo(...args: Parameters<SlideInstance['zoomTo']>): void
  toggleZoom(): void
  setUiVisible(isVisible: boolean): void
  refreshSlideContent(slideIndex: number): void
  refreshLayout(force?: boolean): void
  setOptions(options: LightboxOptions): PreparedLightboxOptions
}

export interface LightboxControllerState {
  sessionId: Readonly<Ref<number>>
  isOpen: Readonly<Ref<boolean>>
  isDestroying: Readonly<Ref<boolean>>
  currIndex: Readonly<Ref<number>>
  potentialIndex: Readonly<Ref<number>>
  totalItems: Readonly<Ref<number>>
  touchSupported: Readonly<Ref<boolean>>
  uiVisible: Readonly<Ref<boolean>>
  hasMouse: Readonly<Ref<boolean>>
  isLoading: Readonly<Ref<boolean>>
  zoomAllowed: Readonly<Ref<boolean>>
  isZoomedIn: Readonly<Ref<boolean>>
  transitionPhase: Readonly<Ref<'idle' | 'opening' | 'open' | 'closing'>>
  currSlide: Readonly<ShallowRef<SlideInstance | undefined>>
  customSlideRenders: Readonly<ShallowRef<LightboxCustomSlideRender[]>>
}

export interface LightboxControllerHooks {
  onBeforeOpen: EventHookOn<void>
  onOpen: EventHookOn<void>
  onChange: EventHookOn<number>
  onClose: EventHookOn<void>
  onDestroy: EventHookOn<void>
}

export class LightboxEvent<T extends string = string> {
  type: T
  defaultPrevented: boolean
  [key: string]: unknown

  constructor(type: T, details?: Record<string, unknown>) {
    this.type = type
    this.defaultPrevented = false
    if (details) {
      Object.assign(this, details)
    }
  }

  preventDefault(): void {
    this.defaultPrevented = true
  }
}

export interface DOMEventsInstance {
  add(target: EventTarget | null | undefined, type: string, listener: EventListenerOrEventListenerObject, passive?: boolean): void
  remove(target: EventTarget | null | undefined, type: string, listener: EventListenerOrEventListenerObject, passive?: boolean): void
  removeAll(): void
}

export interface AnimationsInstance {
  activeAnimations: AnimationInstance[]
  startSpring(props: SpringAnimationProps): void
  startTransition(props: CssAnimationProps): void
  stop(animation: AnimationInstance): void
  stopAll(): void
  stopAllPan(): void
  stopMainScroll(): void
  isPanRunning(): boolean
}

export interface MainScrollInstance {
  x: number
  slideWidth: number
  itemHolders: ItemHolder[]
  resize(resizeSlides?: boolean): void
  resetPosition(): void
  appendHolders(): void
  canBeSwiped(): boolean
  moveIndexBy(diff: number, animate?: boolean, velocityX?: number): boolean
  getCurrSlideX(): number
  isShifted(): boolean
  updateCurrItem(): void
  moveTo(x: number, dragging?: boolean): void
}

export interface GesturesInstance {
  dragAxis: Axis | null
  p1: Point
  p2: Point
  prevP1: Point
  prevP2: Point
  startP1: Point
  startP2: Point
  velocity: Point
  supportsTouch: boolean
  isMultitouch: boolean
  isDragging: boolean
  isZooming: boolean
  raf: number | null
  drag: DragHandlerInstance
  zoomLevels: ZoomHandlerInstance
  tapHandler: TapHandlerInstance
  lightbox: LightboxInstance
}

export interface OpenerInstance {
  isClosed: boolean
  isOpen: boolean
  isClosing: boolean
  isOpening: boolean
  open(): void
  close(): void
  reset(): void
  setInitialThumbBounds(bounds: Bounds | undefined): void
}

export type KeyboardInstance = Record<string, never>
export type ScrollWheelInstance = Record<string, never>

export interface ContentLoaderInstance {
  limit: number
  updateLazy(diff?: number): void
  loadSlideByIndex(initialIndex: number): void
  getContentBySlide(slide: SlideInstance): ContentInstance
  addToCache(content: ContentInstance): void
  removeByIndex(index: number): void
  getContentByIndex(index: number): ContentInstance | undefined
  destroy(): void
}

export interface DragHandlerInstance {
  startPan: Point
  start(): void
  change(): void
  end(): void
}

export interface ZoomHandlerInstance {
  start(): void
  change(): void
  end(): void
  correctZoomPan(ignoreGesture?: boolean): void
}

export interface TapHandlerInstance {
  click(point: Point, originalEvent: PointerEvent): void
  tap(point: Point, originalEvent: PointerEvent): void
  doubleTap(point: Point, originalEvent: PointerEvent): void
}
