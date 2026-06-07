// Internal framework-free API re-exported by @nuxt-photo/vue.

export {
  photoId,
  responsive,
  resolveResponsiveParameter,
  mergeResponsiveBreakpoints,
} from './types'
export {
  normalizePhotos,
  type NormalizePhotosOptions,
  type NormalizePhotosResult,
  type PhotoValidationIssue,
  type PhotoValidationIssueCode,
} from './photo/normalize'
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

export { computeRowsLayout } from './layout/rows/index'
export {
  computeBreakpointStyles,
  type BreakpointStylesOptions,
} from './layout/rows/containerQueries'
export { computeColumnsLayout } from './layout/columns'
export { computeMasonryLayout } from './layout/masonry'

export { createNativeImageAdapter, computePhotoSizes } from './image/adapter'
export { loadImage, type LoadImageResult } from './image/loader'

export {
  isUsableRect,
  getLoopedIndex,
  fitRect,
  flipTransform,
  makeGhostBaseStyle,
  rubberband,
} from './geometry/rect'

export {
  DEFAULT_MIN_ZOOM,
  computeFittedFrame,
  computeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
} from './viewer/zoom'
export {
  classifyGesture,
  isDoubleTap,
  computeCloseDragRatio,
} from './viewer/gestures'

export {
  DEFAULT_TRANSITION_CONFIG,
  getVisibilityRatio,
  shouldUseFlip,
  chooseCloseTransition,
  type TransitionModeConfig,
} from './transition/transitionChoice'
