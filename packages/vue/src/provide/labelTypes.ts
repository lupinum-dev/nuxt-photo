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
  download: string
  share: string
  fullscreen: string
  exitFullscreen: string
  goToSlide: (index: number) => string
  viewPhoto: (index: number) => string
  slideStatus: (index: number, count: number) => string
}

export const PHOTO_LOCALES = [
  'en',
  'de',
  'fr',
  'es',
  'it',
  'nl',
  'pt',
  'pt-PT',
  'ar',
  'he',
] as const
/** Bundled locale codes and regional tags that fall back to a bundled language. */
export type PhotoLocale =
  | (typeof PHOTO_LOCALES)[number]
  | `${Lowercase<(typeof PHOTO_LOCALES)[number]>}-${string}`

/** Exact tags take precedence over primary-language fallback in every entry point. */
export function findPhotoLocale(language: string): (typeof PHOTO_LOCALES)[number] | undefined {
  const code = language.toLowerCase()
  return (
    PHOTO_LOCALES.find((locale) => locale.toLowerCase() === code) ??
    PHOTO_LOCALES.find((locale) => locale === code.split('-')[0])
  )
}

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
  'download',
  'share',
  'fullscreen',
  'exitFullscreen',
  'goToSlide',
  'viewPhoto',
  'slideStatus',
] as const satisfies readonly (keyof PhotoLabels)[]

// The final three labels use index/count templates in every locale tuple.
export const PHOTO_LABEL_FUNCTION_KEYS: readonly (keyof PhotoLabels)[] = PHOTO_LABEL_KEYS.slice(-3)
