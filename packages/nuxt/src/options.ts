import { validatePhotoConfig } from '../../vue/src/config/validate'
import type {
  PhotoLabels,
  PhotoLocale,
  LightboxOptions,
  InvalidPhotoPolicy,
} from '@lupinum/vue-photo'
import { resolveNuxtPhotoLabels } from './runtime/labels'

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
  download: true,
  share: true,
  fullscreen: true,
  exitFullscreen: true,
  goToSlide: true,
  viewPhoto: true,
  slideStatus: true,
} as const satisfies Record<keyof PhotoLabels, true>

export interface NuxtPhotoOptions {
  /** Read public image dimensions at build time and during dev. Default: false. */
  localImages?: boolean
  autoImports?: boolean | { prefix?: string }
  components?: boolean | { prefix?: string; primitives?: boolean }
  css?: 'none' | 'structure' | 'all'
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
