import type { LightboxOptions } from '../config'

/** The query parameter that names the open photo, or null when deep links are off. */
export function photoParam(option: LightboxOptions['deepLink']) {
  return option === true ? 'photo' : typeof option === 'string' ? option : null
}

/** The photo ID a page URL opens with, or null. */
export function initialPhotoId(url: string | undefined, option: LightboxOptions['deepLink']) {
  const param = photoParam(option)
  return url && param ? new URL(url, 'http://nuxt-photo.local').searchParams.get(param) : null
}
