// @lupinum/vue-photo — Vue components, composables, and photo utilities
export { Lightbox, Photo, PhotoAlbum, PhotoCarousel, PhotoGroup } from './components'
export { useLightbox, provideLightbox, useContainerWidth, usePhotoLabels } from './composables'
export {
  LightboxProvider,
  LightboxRoot,
  LightboxOverlay,
  LightboxAmbient,
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
  type LightboxController,
  type LightboxProviderController,
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
  ResponsivePhotoSizes,
  LightboxTransitionOption,
  LightboxNavigationMode,
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

export { createPhoto } from './config'
export type { PhotoConfig, PhotoProvider, LightboxOptions, LightboxTool } from './config'
export type { PhotoLocale } from './provide/labels'
export { validatePhotos } from './core/photo/normalize'

export type { GalleryHandle } from './gallery/runtime'
export { definePhotoProvider } from './providers/resolve'
