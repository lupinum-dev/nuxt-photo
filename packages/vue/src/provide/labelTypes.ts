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
  pauseAutoplay: string
  playAutoplay: string
  goToSlide: (index: number) => string
  viewPhoto: (index: number) => string
  slideStatus: (index: number, count: number) => string
}

export const PHOTO_LOCALES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pt', 'ar', 'he'] as const
export type PhotoLocale = (typeof PHOTO_LOCALES)[number]

/** Label order also maps each locale's template tuple; no translated strings live here. */
export const PHOTO_LABEL_KEYS = [
  'photoViewer',
  'previous',
  'next',
  'zoom',
  'fit',
  'close',
  'loadFailed',
  'previousSlide',
  'nextSlide',
  'pauseAutoplay',
  'playAutoplay',
  'goToSlide',
  'viewPhoto',
  'slideStatus',
] as const satisfies readonly (keyof PhotoLabels)[]

// The final three labels use index/count templates in every locale tuple.
export const PHOTO_LABEL_FUNCTION_KEYS: readonly (keyof PhotoLabels)[] = PHOTO_LABEL_KEYS.slice(-3)
