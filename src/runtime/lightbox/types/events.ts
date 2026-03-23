import type {
  Point,
  LightboxItem,
  SlideInstance,
  ContentInstance,
  ZoomLevelInstance,
  LightboxInstance,
} from './index'

/**
 * Lightbox Events Map
 */
export interface LightboxEventsMap {
  // Initialization
  beforeOpen: undefined
  firstUpdate: undefined
  initialLayout: undefined
  change: undefined
  afterInit: undefined
  bindEvents: undefined

  // Opening/closing transitions
  openingAnimationStart: undefined
  openingAnimationEnd: undefined
  closingAnimationStart: undefined
  closingAnimationEnd: undefined
  uiVisibilityChange: { isVisible: boolean }

  // Closing
  close: undefined
  destroy: undefined

  // Pointer and gesture events
  pointerDown: { originalEvent: PointerEvent }
  pointerMove: { originalEvent: PointerEvent }
  pointerUp: { originalEvent: PointerEvent }
  pinchClose: { bgOpacity: number }
  verticalDrag: { panY: number }

  // Slide content events
  contentInit: { content: ContentInstance }
  contentLoad: { content: ContentInstance, isLazy: boolean }
  contentLoadImage: { content: ContentInstance, isLazy: boolean }
  loadComplete: { slide: SlideInstance, content: ContentInstance, isError?: boolean }
  loadError: { slide: SlideInstance, content: ContentInstance }
  contentResize: { content: ContentInstance, width: number, height: number }
  imageSizeChange: { content: ContentInstance, width: number, height: number, slide: SlideInstance }
  contentLazyLoad: { content: ContentInstance }
  contentAppend: { content: ContentInstance }
  contentActivate: { content: ContentInstance }
  contentDeactivate: { content: ContentInstance }
  contentRemove: { content: ContentInstance }
  contentDestroy: { content: ContentInstance }

  // Actions
  imageClickAction: { point: Point, originalEvent: PointerEvent }
  bgClickAction: { point: Point, originalEvent: PointerEvent }
  tapAction: { point: Point, originalEvent: PointerEvent }
  doubleTapAction: { point: Point, originalEvent: PointerEvent }

  // Misc
  keydown: { originalEvent: KeyboardEvent }
  moveMainScroll: { x: number, dragging: boolean }
  firstZoomPan: { slide: SlideInstance }
  gettingData: { slide: SlideInstance | undefined, data: LightboxItem, index: number }
  beforeResize: undefined
  resize: undefined
  viewportSize: undefined
  updateScrollOffset: undefined
  slideInit: { slide: SlideInstance }
  afterSetContent: { slide: SlideInstance }
  slideLoad: { slide: SlideInstance }
  appendHeavy: { slide: SlideInstance }
  appendHeavyContent: { slide: SlideInstance }
  slideActivate: { slide: SlideInstance }
  slideDeactivate: { slide: SlideInstance }
  slideDestroy: { slide: SlideInstance }
  beforeZoomTo: { destZoomLevel: number, centerPoint: Point | undefined, transitionDuration: number | false | undefined }
  zoomPanUpdate: { slide: SlideInstance }
  initialZoomPan: { slide: SlideInstance }
  calcSlideSize: { slide: SlideInstance }
  resolutionChanged: undefined
  wheel: { originalEvent: WheelEvent }
  contentAppendImage: { content: ContentInstance }
  lazyLoadSlide: { index: number, itemData: LightboxItem }
  lazyLoad: undefined
  calcBounds: { slide: SlideInstance }
  zoomLevelsUpdate: { zoomLevels: ZoomLevelInstance, slideData: LightboxItem }

  // Legacy
  init: undefined
  initialZoomIn: undefined
  initialZoomOut: undefined
  initialZoomInEnd: undefined
  initialZoomOutEnd: undefined
  numItems: { numItems: number }
  itemData: { itemData: LightboxItem, index: number }
  thumbBounds: { index: number, itemData: LightboxItem, instance: LightboxInstance }
}
