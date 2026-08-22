// @lupinum/vue-photo — Vue components, composables, and photo utilities
export { Lightbox, Photo, PhotoAlbum, PhotoCarousel, PhotoGroup } from './components'
export { useLightbox, provideLightbox, useContainerWidth, usePhotoLabels } from './composables'
export {
  LightboxProvider,
  LightboxRoot,
  LightboxOverlay,
  LightboxViewport,
  LightboxSlide,
  LightboxControls,
  LightboxCaption,
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
  PhotoDefaultsKey,
  type LightboxController,
  type LightboxHandle,
  type LightboxProviderController,
  type PhotoDefaults,
  type LightboxSlideRenderer,
  type PhotoLabels,
} from './provide'
export { responsive, resolveResponsiveParameter } from './core/types'
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
} from './core/types'
export type {
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  PhotoValidationIssue,
  PhotoValidationIssueCode,
} from './core/photo/normalize'
export { PhotoValidationError } from './core/photo/normalize'
