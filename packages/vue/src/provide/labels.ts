/** Complete user-visible and assistive text rendered by Nuxt Photo. */
export interface PhotoLabels {
  photoViewer: string
  previous: string
  next: string
  zoom: string
  fit: string
  close: string
  loadFailed: string
  previousSlide: string
  nextSlide: string
  goToSlide: (index: number) => string
  viewPhoto: (index: number) => string
  slideStatus: (index: number, count: number) => string
}

export const DEFAULT_PHOTO_LABELS: Readonly<PhotoLabels> = Object.freeze({
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
  slideStatus: (index, count) => `Slide ${index} of ${count}`,
})

export function resolvePhotoLabels(partial?: Partial<PhotoLabels>): PhotoLabels {
  return { ...DEFAULT_PHOTO_LABELS, ...partial }
}
