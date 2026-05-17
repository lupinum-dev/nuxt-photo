// @nuxt-photo/core — documented app-facing API

export {
  photoId,
  responsive,
  resolveResponsiveParameter,
  mergeResponsiveBreakpoints,
} from './types'
export type {
  PhotoItem,
  PhotoMapper,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
  ImageAdapter,
  ImageContext,
  ImageSource,
  LightboxTransitionOption,
  TransitionMode,
  ResponsiveParameter,
  ResponsiveResolver,
  LayoutInput,
  RowsLayoutOptions,
  ColumnsLayoutOptions,
  MasonryLayoutOptions,
  LayoutEntry,
  LayoutGroup,
  RectLike,
  AreaMetrics,
  PanState,
  PanBounds,
  ZoomState,
  GestureMode,
} from './types'

export {
  computeRowsLayout,
  computeColumnsLayout,
  computeMasonryLayout,
  computeBreakpointStyles,
  type BreakpointStylesOptions,
} from './layout'

export {
  createNativeImageAdapter,
  computePhotoSizes,
  loadImage,
  type LoadImageResult,
} from './image'

export {
  isUsableRect,
  getLoopedIndex,
  fitRect,
  flipTransform,
  makeGhostBaseStyle,
  rubberband,
} from './geometry'

export {
  type Spring1D,
  createSpring1D,
  stopSpring,
  springStep,
  runSpring,
  VelocityTracker,
  animateNumber,
  easeOutCubic,
  easeInOutCubic,
} from './physics'

export { wait, nextFrame, lockBodyScroll } from './dom'

export {
  DEFAULT_MIN_ZOOM,
  computeFittedFrame,
  computeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
  classifyGesture,
  isDoubleTap,
  computeCloseDragRatio,
} from './viewer'

export { createDebug, type DebugLogger, type DebugFlags } from './debug'

export {
  createTransitionMode,
  getVisibilityRatio,
  shouldUseFlip,
  planCloseTransition,
  type TransitionModeConfig,
} from './transition'

export { isDev, devWarn } from './env'
export { round, getWindowDimensions } from './utils'
