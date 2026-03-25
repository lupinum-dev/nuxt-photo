// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'
export * from './provide'

// Re-export core types for convenience
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
  ImageSource,
  LayoutInput,
  LayoutOutput,
} from '@nuxt-photo/core'
