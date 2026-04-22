// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'
export * from './types'
export {
  ImageAdapterKey,
  LightboxComponentKey,
  LightboxDefaultsKey,
  PhotoGroupContextKey,
  type LightboxDefaults,
  type LightboxSlideRenderer,
  type PhotoGroupContext,
} from './provide/keys'

// Re-export core utilities for convenience
export { responsive, resolveResponsiveParameter } from '@nuxt-photo/core'
export type { LightboxTransitionOption } from '@nuxt-photo/engine'
export type {
  PhotoItem,
  AreaMetrics,
  RectLike,
  PanState,
  ZoomState,
  GestureMode,
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
