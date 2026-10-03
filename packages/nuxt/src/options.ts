import { validatePhotoConfig } from '../../vue/src/config/validate'
import type {
  PhotoLabels,
  PhotoLocale,
  LightboxOptions,
  InvalidPhotoPolicy,
} from '@lupinum/vue-photo'
import { resolveNuxtPhotoLabels } from './runtime/labels'

export type NuxtPhotoImageAdapterConfig = {
  format?: 'webp' | 'avif' | 'auto'
  placeholder?: boolean
  thumb?: {
    widths?: number[]
    sizes?: string
    quality?: number
  }
  slide?: {
    widths?: number[]
    maxWidth?: number
    sizes?: string
    quality?: number
  }
}

/** String templates use `{index}` and, for `slideStatus`, `{count}`. */
export type NuxtPhotoLabelsConfig = Partial<Record<keyof PhotoLabels, string>>

export const NUXT_PHOTO_LABEL_KEYS = {
  photoViewer: true,
  previous: true,
  next: true,
  zoom: true,
  fit: true,
  close: true,
  loadFailed: true,
  previousSlide: true,
  nextSlide: true,
  pauseAutoplay: true,
  playAutoplay: true,
  goToSlide: true,
  viewPhoto: true,
  slideStatus: true,
} as const satisfies Record<keyof PhotoLabels, true>

type NuxtPhotoImageOptions =
  | false
  | ({
      provider?: 'auto' | 'nuxt-image' | 'native'
    } & NuxtPhotoImageAdapterConfig)

export interface NuxtPhotoOptions {
  /** Read public image dimensions at build time and during dev. Default: false. */
  localImages?: boolean
  autoImports?: boolean | { prefix?: string }
  components?: boolean | { prefix?: string; primitives?: boolean }
  css?: 'none' | 'structure' | 'all'
  image?: NuxtPhotoImageOptions
  lightbox?: LightboxOptions
  validation?: InvalidPhotoPolicy
  provider?: string
  labels?: PhotoLocale | NuxtPhotoLabelsConfig
}

export const NUXT_PHOTO_DEFAULTS = {
  localImages: false,
  autoImports: true,
  components: { prefix: '' },
  css: 'structure',
  image: { provider: 'auto' },
} satisfies NuxtPhotoOptions

function configError(path: string, expected: string) {
  return new TypeError(`[nuxt-photo] \`nuxtPhoto.${path}\` must be ${expected}.`)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)
  )
}

function assertPlainRecord(value: unknown, path: string): asserts value is Record<string, unknown> {
  if (!isPlainRecord(value)) throw configError(path, 'an object')
}

function assertKnownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string) {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key))
  if (!unknown) return
  const fullPath = path ? `${path}.${unknown}` : unknown
  throw new TypeError(`[nuxt-photo] Unknown \`nuxtPhoto.${fullPath}\` option.`)
}

function assertString(value: unknown, path: string) {
  if (value !== undefined && typeof value !== 'string') {
    throw configError(path, 'a string')
  }
}

function assertBoolean(value: unknown, path: string) {
  if (value !== undefined && typeof value !== 'boolean') {
    throw configError(path, 'a boolean')
  }
}

function assertFiniteNumber(value: unknown, path: string) {
  if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) {
    throw configError(path, 'a finite number')
  }
}

function assertPositiveNumber(value: unknown, path: string) {
  assertFiniteNumber(value, path)
  if (typeof value === 'number' && value <= 0) {
    throw configError(path, 'greater than 0')
  }
}

function assertQuality(value: unknown, path: string) {
  assertFiniteNumber(value, path)
  if (typeof value === 'number' && (value < 1 || value > 100)) {
    throw configError(path, 'between 1 and 100')
  }
}

function assertWidths(value: unknown, path: string) {
  if (value === undefined) return
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    Array.from(value).some(
      (item, index) =>
        !Object.hasOwn(value, index) ||
        typeof item !== 'number' ||
        !Number.isInteger(item) ||
        item <= 0,
    )
  ) {
    throw configError(path, 'a non-empty array of positive integers')
  }
}

function validateToggleRecord(value: unknown, path: string) {
  if (value === undefined || typeof value === 'boolean') return
  if (!isPlainRecord(value)) throw configError(path, 'a boolean or object')
  const record = { ...value }
  assertKnownKeys(record, path === 'components' ? ['prefix', 'primitives'] : ['prefix'], path)
  assertString(record.prefix, `${path}.prefix`)
  if (path === 'components') {
    assertBoolean(record.primitives, 'components.primitives')
  }
}

/** Validate all runtime configuration before the module mutates Nuxt state. */
export function validateNuxtPhotoOptions(value: unknown): asserts value is NuxtPhotoOptions {
  assertPlainRecord(value, '')
  const options = { ...value }
  assertKnownKeys(
    options,
    [
      'autoImports',
      'components',
      'css',
      'image',
      'lightbox',
      'labels',
      'localImages',
      'validation',
      'provider',
    ],
    '',
  )

  if (
    options.css !== undefined &&
    (typeof options.css !== 'string' || !['none', 'structure', 'all'].includes(options.css))
  ) {
    throw configError('css', '"none", "structure", or "all"')
  }

  assertBoolean(options.localImages, 'localImages')
  validateToggleRecord(options.autoImports, 'autoImports')
  validateToggleRecord(options.components, 'components')

  if (options.image !== undefined && options.image !== false) {
    if (!isPlainRecord(options.image)) {
      throw configError('image', 'false or an object')
    }
    const image = { ...options.image }
    assertKnownKeys(image, ['provider', 'format', 'placeholder', 'thumb', 'slide'], 'image')
    if (
      image.provider !== undefined &&
      (typeof image.provider !== 'string' ||
        !['auto', 'nuxt-image', 'native'].includes(image.provider))
    ) {
      throw configError('image.provider', '"auto", "nuxt-image", or "native"')
    }

    if (
      image.format !== undefined &&
      (typeof image.format !== 'string' || !['webp', 'avif', 'auto'].includes(image.format))
    ) {
      throw configError('image.format', '"webp", "avif", or "auto"')
    }
    assertBoolean(image.placeholder, 'image.placeholder')

    if (image.thumb !== undefined) {
      assertPlainRecord(image.thumb, 'image.thumb')
      const thumb = { ...image.thumb }
      assertKnownKeys(thumb, ['widths', 'sizes', 'quality'], 'image.thumb')
      assertString(thumb.sizes, 'image.thumb.sizes')
      if (typeof thumb.sizes === 'string' && /(^|\s)[a-z0-9]+:\S/i.test(thumb.sizes)) {
        throw new TypeError(
          "[nuxt-photo] `nuxtPhoto.image.thumb.sizes` is now an HTML sizes string, e.g. '(max-width: 768px) 100vw, 400px'.",
        )
      }
      assertWidths(thumb.widths, 'image.thumb.widths')
      assertQuality(thumb.quality, 'image.thumb.quality')
    }

    if (image.slide !== undefined) {
      assertPlainRecord(image.slide, 'image.slide')
      const slide = { ...image.slide }
      assertKnownKeys(slide, ['widths', 'maxWidth', 'sizes', 'quality'], 'image.slide')
      assertWidths(slide.widths, 'image.slide.widths')
      assertPositiveNumber(slide.maxWidth, 'image.slide.maxWidth')
      assertString(slide.sizes, 'image.slide.sizes')
      assertQuality(slide.quality, 'image.slide.quality')
    }
  }

  assertString(options.provider, 'provider')
  if (options.labels !== undefined && typeof options.labels !== 'string') {
    assertPlainRecord(options.labels, 'labels')
    assertKnownKeys(options.labels, Object.keys(NUXT_PHOTO_LABEL_KEYS), 'labels')
    for (const key of Object.keys(options.labels))
      assertString(options.labels[key], `labels.${key}`)
  }
  // Both entry points use the core validator; Nuxt converts string templates first.
  validatePhotoConfig(
    {
      lightbox: options.lightbox,
      validation: options.validation,
      labels:
        typeof options.labels === 'string'
          ? options.labels
          : resolveNuxtPhotoLabels(options.labels as NuxtPhotoLabelsConfig | undefined),
    },
    'nuxtPhoto',
  )
}
