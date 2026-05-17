// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'
export * from './types'
export {
  ImageAdapterKey,
  LightboxComponentKey,
  LightboxDefaultsKey,
  PhotoGroupContextKey,
  type LightboxController,
  type LightboxDefaults,
  type LightboxSlideRenderer,
  type PhotoGroupContext,
} from './provide/keys'

// Re-export core utilities for convenience
export { responsive, resolveResponsiveParameter } from '@nuxt-photo/core'
export type {
  PhotoItem,
  LightboxTransitionOption,
  AreaMetrics,
  RectLike,
  PanState,
  ZoomState,
  GestureMode,
  TransitionMode,
  ImageAdapter,
  PhotoMapper,
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
