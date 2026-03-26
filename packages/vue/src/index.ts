// @nuxt-photo/vue — Vue bindings over core
export * from './composables'
export * from './primitives'

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
  LayoutEntry,
  LayoutGroup,
} from '@nuxt-photo/core'
