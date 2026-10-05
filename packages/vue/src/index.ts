// @lupinum/vue-photo — Vue components, composables, and photo utilities
export { Lightbox, Photo, PhotoAlbum, PhotoCarousel, PhotoGroup } from './components'
export { useLightbox, usePhotoLabels } from './composables'
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
export { type LightboxController, type PhotoLabels } from './provide'
export { responsive } from './core/types'
export type {
  PhotoItem,
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
  ResponsiveParameter,
} from './core/types'
export type {
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  PhotoValidationIssue,
  PhotoValidationIssueCode,
} from './core/photo/normalize'
export { PhotoValidationError } from './core/photo/normalize'

export { createPhoto } from './config/plugin'
export type { PhotoConfig, PhotoProvider, LightboxOptions, LightboxTool } from './config'
export type { PhotoLocale } from './provide/labels'
export { validatePhotos } from './core/photo/normalize'

export type { GalleryHandle } from './gallery/runtime'
export { definePhotoProvider } from './providers/resolve'

export type { PhotoUi, CarouselControl } from './types'
