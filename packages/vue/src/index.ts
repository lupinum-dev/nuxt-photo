// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'
export { LightboxComponentKey, LightboxContextKey, LightboxDefaultsKey } from './provide/keys'
export type { LightboxDefaults } from './provide/keys'

// Re-export core utilities for convenience
export { responsive, resolveResponsiveParameter } from '@nuxt-photo/core'
export type {
  PhotoItem,
  SlideItem,
  AreaMetrics,
  RectLike,
  PanState,
  ZoomState,
  GestureMode,
  PanzoomMotion,
  CarouselStyle,
  CarouselConfig,
  ViewerState,
  TransitionMode,
  ImageAdapter,
  PhotoAdapter,
  ImageSource,
  LayoutInput,
  LayoutEntry,
  LayoutGroup,
  ResponsiveParameter,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
} from '@nuxt-photo/core'
