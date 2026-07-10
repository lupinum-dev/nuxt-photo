// @nuxt-photo/vue — Vue components, composables, and photo utilities
export {
  Lightbox,
  Photo,
  PhotoAlbum,
  PhotoCarousel,
  PhotoGroup,
} from './components'
export {
  useLightbox,
  useLightboxProvider,
  useContainerWidth,
} from './composables'
export {
  LightboxProvider,
  LightboxRoot,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxCaption,
  LightboxGhostImage,
  PhotoTrigger,
  PhotoImage,
} from './primitives'
export type {
  LightboxControlsSlotProps,
  LightboxCaptionSlotProps,
  LightboxSlideSlotProps,
  LightboxViewportSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
} from './types'
export {
  ImageAdapterKey,
  LightboxComponentKey,
  LightboxDefaultsKey,
  type LightboxController,
  type LightboxProviderController,
  type LightboxDefaults,
  type LightboxSlideRenderer,
} from './provide/keys'
export { responsive, resolveResponsiveParameter } from './core/types'
export type {
  PhotoItem,
  AlbumLayout,
  RowsAlbumLayout,
  ColumnsAlbumLayout,
  MasonryAlbumLayout,
  PhotoCarouselOptions,
  PhotoCarouselAutoplayOptions,
  ImageAdapter,
  ImageContext,
  ImageSource,
  LightboxTransitionOption,
  TransitionMode,
  ResponsiveParameter,
  ResponsiveResolver,
} from './core/types'
export type {
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  PhotoValidationIssue,
  PhotoValidationIssueCode,
} from './core/photo/normalize'
export { PhotoValidationError } from './core/photo/normalize'
