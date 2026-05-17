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
} from './layout'

export {
  createNativeImageAdapter,
  computePhotoSizes,
  loadImage,
  type LoadImageResult,
} from './image'
