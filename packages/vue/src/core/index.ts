// Internal framework-free barrel used by the Vue implementation.

export { responsive, resolveResponsiveValue, mergeResponsiveBreakpoints } from './types'
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
  ResolvedPhotoItem,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
  GridAlbumLayout,
  BentoAlbumLayout,
  MosaicAlbumLayout,
  AccordionAlbumLayout,
  PhotoCarouselAutoplayOptions,
  ResponsivePhotoSizes,
  LightboxTransitionOption,
  LightboxNavigationMode,
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
  DEFAULT_BENTO_COLUMNS,
  DEFAULT_BREAKPOINTS,
  DEFAULT_COLUMNS,
  DEFAULT_PADDING,
  DEFAULT_SPACING,
  DEFAULT_TARGET_ROW_HEIGHT,
  computeGaps,
  isLayoutType,
  layoutCropsPhotos,
} from './layout/constants'
export type { AlbumPlan, AlbumPlanItem, AlbumPlanWidths } from './layout/plan'
export { computeRowsPlan, type RowBreakMemo, type RowsPlan } from './layout/rows/plan'
export { computeColumnsLayout, computeColumnsPlan } from './layout/columns'
export { computeMasonryLayout, computeMasonryPlan } from './layout/masonry'

export { computePhotoSizes } from './image/sizes'
export { isUsableRect, fitRect, coverPose, restingClip, rubberband } from './geometry/rect'
export type { Inset, Pose } from './geometry/rect'

export { DEFAULT_MIN_ZOOM } from './viewer/defaults'
export {
  computeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
} from './viewer/zoom'
export { classifyGesture, isDoubleTap } from './viewer/gestures'
export { planSettle } from './viewer/settle'

export {
  DEFAULT_TRANSITION_CONFIG,
  getVisibilityRatio,
  shouldUseFlip,
  chooseCloseTransition,
  type TransitionModeConfig,
} from './transition/transitionChoice'

export { computeFramePlan } from './layout/frame'
