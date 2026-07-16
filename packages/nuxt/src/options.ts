export type NuxtPhotoImageAdapterConfig = {
  thumb?: {
    sizes?: string
    quality?: number
  }
  slide?: {
    widths?: number[]
    maxWidth?: number
    maxDensity?: number
    sizes?: string
    quality?: number
  }
}

export type NuxtPhotoRuntimeConfig = {
  image?: NuxtPhotoImageAdapterConfig
  lightbox?: {
    minZoom?: number
  }
}

type NuxtPhotoImageOptions =
  | false
  | ({
      provider?: 'auto' | 'nuxt-image' | 'native'
    } & NuxtPhotoImageAdapterConfig)

export interface NuxtPhotoOptions {
  autoImports?: boolean | { prefix?: string }
  components?: boolean | { prefix?: string; primitives?: boolean }
  css?: 'none' | 'structure' | 'all'
  image?: NuxtPhotoImageOptions
  lightbox?: NuxtPhotoRuntimeConfig['lightbox']
}

export const NUXT_PHOTO_DEFAULTS = {
  autoImports: true,
  components: { prefix: '' },
  css: 'structure',
  image: { provider: 'auto' },
} satisfies NuxtPhotoOptions

function configError(path: string, expected: string) {
  return new TypeError(`[nuxt-photo] \`nuxtPhoto.${path}\` must be ${expected}.`)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
    value.some((item) => typeof item !== 'number' || !Number.isInteger(item) || item <= 0)
  ) {
    throw configError(path, 'a non-empty array of positive integers')
  }
}

function validateToggleRecord(value: unknown, path: string) {
  if (value === undefined || typeof value === 'boolean') return
  if (!isPlainRecord(value)) throw configError(path, 'a boolean or object')
  assertKnownKeys(value, path === 'components' ? ['prefix', 'primitives'] : ['prefix'], path)
  assertString(value.prefix, `${path}.prefix`)
  if (path === 'components') {
    assertBoolean(value.primitives, 'components.primitives')
  }
}

/** Validate all runtime configuration before the module mutates Nuxt state. */
export function validateNuxtPhotoOptions(options: unknown): asserts options is NuxtPhotoOptions {
  assertPlainRecord(options, '')
  assertKnownKeys(options, ['autoImports', 'components', 'css', 'image', 'lightbox'], '')

  if (options.css !== undefined && !['none', 'structure', 'all'].includes(String(options.css))) {
    throw configError('css', '"none", "structure", or "all"')
  }

  validateToggleRecord(options.autoImports, 'autoImports')
  validateToggleRecord(options.components, 'components')

  if (options.image !== undefined && options.image !== false) {
    if (!isPlainRecord(options.image)) {
      throw configError('image', 'false or an object')
    }
    assertKnownKeys(options.image, ['provider', 'thumb', 'slide'], 'image')
    if (
      options.image.provider !== undefined &&
      !['auto', 'nuxt-image', 'native'].includes(String(options.image.provider))
    ) {
      throw configError('image.provider', '"auto", "nuxt-image", or "native"')
    }

    if (options.image.thumb !== undefined) {
      assertPlainRecord(options.image.thumb, 'image.thumb')
      assertKnownKeys(options.image.thumb, ['sizes', 'quality'], 'image.thumb')
      assertString(options.image.thumb.sizes, 'image.thumb.sizes')
      assertQuality(options.image.thumb.quality, 'image.thumb.quality')
    }

    if (options.image.slide !== undefined) {
      assertPlainRecord(options.image.slide, 'image.slide')
      assertKnownKeys(
        options.image.slide,
        ['widths', 'maxWidth', 'maxDensity', 'sizes', 'quality'],
        'image.slide',
      )
      assertWidths(options.image.slide.widths, 'image.slide.widths')
      assertPositiveNumber(options.image.slide.maxWidth, 'image.slide.maxWidth')
      assertPositiveNumber(options.image.slide.maxDensity, 'image.slide.maxDensity')
      assertString(options.image.slide.sizes, 'image.slide.sizes')
      assertQuality(options.image.slide.quality, 'image.slide.quality')
    }
  }

  if (options.lightbox !== undefined) {
    assertPlainRecord(options.lightbox, 'lightbox')
    assertKnownKeys(options.lightbox, ['minZoom'], 'lightbox')
    assertPositiveNumber(options.lightbox.minZoom, 'lightbox.minZoom')
  }
}
