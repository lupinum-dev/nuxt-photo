import type { PhotoConfig } from './index'
import { PHOTO_LOCALES, DEFAULT_PHOTO_LABELS } from '../provide/labels'

function error(path: string, expected: string): never {
  throw new TypeError(`[nuxt-photo] \`${path}\` must be ${expected}.`)
}
function record(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
    error(path, 'an object')
}
function keys(value: Record<string, unknown>, allowed: string[], path: string) {
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      throw new TypeError(`[nuxt-photo] Unknown \`${path}.${key}\` option.`)
}
function enumeration(value: unknown, allowed: readonly string[], path: string) {
  if (value !== undefined && (typeof value !== 'string' || !allowed.includes(value)))
    error(path, allowed.map((v) => `"${v}"`).join(', '))
}
/** The same boundary validation is used by Vue installation and Nuxt setup. */
export function validatePhotoConfig(value: unknown, path = 'photo'): asserts value is PhotoConfig {
  record(value, path)
  keys(value, ['provider', 'labels', 'lightbox', 'validation', 'dimensions'], path)
  enumeration(value.validation, ['throw', 'drop'], `${path}.validation`)
  if (value.dimensions !== undefined && typeof value.dimensions !== 'function')
    error(`${path}.dimensions`, 'a function')
  if (value.provider !== undefined) {
    record(value.provider, `${path}.provider`)
    keys(value.provider, ['url', 'placeholder', 'srcset'], `${path}.provider`)
    if (typeof value.provider.url !== 'function') error(`${path}.provider.url`, 'a function')
    for (const key of ['placeholder', 'srcset'])
      if (value.provider[key] !== undefined && typeof value.provider[key] !== 'function')
        error(`${path}.provider.${key}`, 'a function')
  }
  if (value.labels !== undefined) {
    if (typeof value.labels === 'string') enumeration(value.labels, PHOTO_LOCALES, `${path}.labels`)
    else {
      record(value.labels, `${path}.labels`)
      keys(value.labels, Object.keys(DEFAULT_PHOTO_LABELS), `${path}.labels`)
      for (const [key, label] of Object.entries(value.labels)) {
        const expected = typeof DEFAULT_PHOTO_LABELS[key as keyof typeof DEFAULT_PHOTO_LABELS]
        if (label !== undefined && typeof label !== expected)
          error(`${path}.labels.${key}`, expected === 'function' ? 'a function' : 'a string')
      }
    }
  }
  if (value.lightbox !== undefined) {
    const box = value.lightbox
    record(box, `${path}.lightbox`)
    keys(
      box,
      ['component', 'transition', 'navigation', 'minZoom', 'history', 'deepLink', 'tools'],
      `${path}.lightbox`,
    )
    if (
      box.component !== undefined &&
      (box.component === null || !['object', 'function'].includes(typeof box.component))
    )
      error(`${path}.lightbox.component`, 'a Vue component')
    if (box.transition !== undefined) {
      if (typeof box.transition === 'string')
        enumeration(box.transition, ['auto', 'flip', 'fade', 'none'], `${path}.lightbox.transition`)
      else {
        record(box.transition, `${path}.lightbox.transition`)
        keys(box.transition, ['mode', 'autoThreshold'], `${path}.lightbox.transition`)
        if (box.transition.mode === undefined)
          error(`${path}.lightbox.transition.mode`, '"auto", "flip", "fade", or "none"')
        enumeration(
          box.transition.mode,
          ['auto', 'flip', 'fade', 'none'],
          `${path}.lightbox.transition.mode`,
        )
        const threshold = box.transition.autoThreshold
        if (
          threshold !== undefined &&
          (typeof threshold !== 'number' ||
            !Number.isFinite(threshold) ||
            threshold < 0 ||
            threshold > 1)
        )
          error(`${path}.lightbox.transition.autoThreshold`, 'a number between 0 and 1')
      }
    }
    enumeration(box.navigation, ['slide', 'fade', 'crossfade'], `${path}.lightbox.navigation`)
    if (
      box.minZoom !== undefined &&
      (typeof box.minZoom !== 'number' || !Number.isFinite(box.minZoom) || box.minZoom <= 0)
    )
      error(`${path}.lightbox.minZoom`, 'greater than 0')
    if (box.history !== undefined && typeof box.history !== 'boolean')
      error(`${path}.lightbox.history`, 'a boolean')
    if (
      box.deepLink !== undefined &&
      typeof box.deepLink !== 'boolean' &&
      (typeof box.deepLink !== 'string' || !box.deepLink.trim())
    )
      error(`${path}.lightbox.deepLink`, 'a boolean or non-empty string')
    if (
      box.tools !== undefined &&
      (!Array.isArray(box.tools) ||
        Array.from(box.tools).some(
          (tool) => typeof tool !== 'string' || !['download', 'share', 'fullscreen'].includes(tool),
        ))
    )
      error(`${path}.lightbox.tools`, 'an array of "download", "share", or "fullscreen"')
  }
}
