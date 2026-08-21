// Internal framework-free barrel used by the Vue implementation.

export { responsive, resolveResponsiveParameter, mergeResponsiveBreakpoints } from './types'
export {
  normalizePhotos,
  type NormalizePhotosOptions,
  type NormalizePhotosResult,
  type InvalidPhotoPolicy,
  type InvalidPhotosEvent,
  type PhotoValidationIssue,
  type PhotoValidationIssueCode,
  PhotoValidationError,
} from './photo/normalize'
export type {
  PhotoItem,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
  PhotoCarouselAutoplayOptions,
  ImageAdapter,
  ImageContext,
  ImageSource,
  ResponsivePhotoSizes,
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
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  computeGaps,
  computeWidthDivisor,
} from './layout/constants'
export {
  computeBreakpointStyles,
  type BreakpointStylesOptions,
} from './layout/rows/containerQueries'
export { computeColumnsLayout } from './layout/columns'
export { computeMasonryLayout } from './layout/masonry'

export { createNativeImageAdapter, computePhotoSizes } from './image/adapter'
export { isUsableRect, getLoopedIndex, fitRect, flipTransform, rubberband } from './geometry/rect'

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
export { classifyGesture, isDoubleTap } from './viewer/gestures'

export {
  DEFAULT_TRANSITION_CONFIG,
  getVisibilityRatio,
  shouldUseFlip,
  chooseCloseTransition,
  type TransitionModeConfig,
} from './transition/transitionChoice'
