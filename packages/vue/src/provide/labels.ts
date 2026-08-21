/**
 * User-visible UI strings and accessibility labels.
 *
 * Every string the library renders or exposes to assistive technology is
 * collected here so applications (and i18n modules) can localize them in one
 * place. Functions receive 1-based indices ready for display.
 */
export interface PhotoLabels {
  /** `aria-label` of the lightbox dialog root. */
  photoViewer: string
  /** Lightbox previous button. */
  previous: string
  /** Lightbox next button. */
  next: string
  /** Lightbox zoom-in button. */
  zoom: string
  /** Lightbox zoom-out button. */
  fit: string
  /** Lightbox close button. */
  close: string
  /** Message rendered when the active slide image fails to load. */
  loadFailed: string
  /** Carousel previous arrow. */
  previousSlide: string
  /** Carousel next arrow. */
  nextSlide: string
  /** Carousel dot / thumbnail buttons. Receives a 1-based slide number. */
  goToSlide: (index: number) => string
  /** Photo trigger fallback when the photo has no alt text. Receives a 1-based photo number. */
  viewPhoto: (index: number) => string
}

export const DEFAULT_PHOTO_LABELS: PhotoLabels = {
  photoViewer: 'Photo viewer',
  previous: 'Previous',
  next: 'Next',
  zoom: 'Zoom',
  fit: 'Fit',
  close: 'Close',
  loadFailed: 'Image could not be loaded.',
  previousSlide: 'Previous slide',
  nextSlide: 'Next slide',
  goToSlide: (index) => `Go to slide ${index}`,
  viewPhoto: (index) => `View photo ${index}`,
}

/** Merge partial user labels over the built-in English defaults. */
export function resolvePhotoLabels(partial?: Partial<PhotoLabels>): PhotoLabels {
  if (!partial) return DEFAULT_PHOTO_LABELS
  return { ...DEFAULT_PHOTO_LABELS, ...partial }
}
