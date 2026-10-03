import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  type Component,
  type ComputedRef,
  type InjectionKey,
  type Plugin,
} from 'vue'
import { createNativeImageAdapter } from '../core/image/adapter'
import type {
  ImageAdapter,
  LightboxNavigationMode,
  LightboxTransitionOption,
  PhotoItem,
} from '../core/types'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
import {
  detectPhotoLocale,
  resolvePhotoLabels,
  type PhotoLabels,
  type PhotoLocale,
} from '../provide/labels'
import { validatePhotoConfig } from './validate'

export interface PhotoProvider {
  url(src: string, options: { width: number; quality?: number; format?: string }): string
  placeholder?(src: string): string | undefined
  srcset?(photo: PhotoItem, context: 'thumb' | 'slide'): string | undefined
}
export type LightboxTool = 'download' | 'share' | 'fullscreen'
export interface LightboxOptions {
  component?: Component
  transition?: LightboxTransitionOption
  navigation?: LightboxNavigationMode
  minZoom?: number
  history?: boolean
  deepLink?: boolean | string
  tools?: LightboxTool[]
}
export interface PhotoConfig {
  /** Image URL resolver. Provider candidate sizing is handled by the image pipeline. */
  provider?: PhotoProvider
  /** Locale code, or per-key overrides on top of the detected locale. */
  labels?: PhotoLocale | Partial<PhotoLabels>
  lightbox?: LightboxOptions
  /** Throw on invalid data by default; collection recipes can opt into dropping invalid photos. */
  validation?: InvalidPhotoPolicy
  /** Resolve missing intrinsic dimensions before validating photo data. */
  dimensions?: (src: string) => { width: number; height: number } | undefined
}
export interface ResolvedPhotoConfig extends Omit<
  PhotoConfig,
  'labels' | 'lightbox' | 'validation'
> {
  labels: PhotoLabels
  lightbox: LightboxOptions
  validation: InvalidPhotoPolicy
  /** Existing adapter bridge until the provider slice replaces image resolution. */
  imageAdapter: ImageAdapter
}
export const photoConfigKey: InjectionKey<ComputedRef<ResolvedPhotoConfig>> =
  Symbol('nuxt-photo:config')
// Vue inject() reads ancestors, so retain the current recipe config for its setup consumers.
const localConfigs = new WeakMap<object, ComputedRef<ResolvedPhotoConfig>>()

export function mergePhotoConfig(
  parent: ResolvedPhotoConfig,
  overrides: PhotoConfig,
): ResolvedPhotoConfig {
  const defined = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  )
  return {
    ...parent,
    ...defined,
    labels:
      typeof overrides.labels === 'string'
        ? resolvePhotoLabels(overrides.labels)
        : {
            ...parent.labels,
            ...Object.fromEntries(
              Object.entries(overrides.labels ?? {}).filter(([, value]) => value !== undefined),
            ),
          },
    lightbox: {
      ...parent.lightbox,
      ...Object.fromEntries(
        Object.entries(overrides.lightbox ?? {}).filter(([, value]) => value !== undefined),
      ),
    },
    imageAdapter: overrides.provider ? providerAdapter(overrides.provider) : parent.imageAdapter,
  }
}
function defaults(locale?: string): ResolvedPhotoConfig {
  return {
    labels: resolvePhotoLabels(undefined, detectPhotoLocale(locale)),
    lightbox: { minZoom: 1.5, transition: 'auto', navigation: 'slide' },
    validation: 'throw',
    imageAdapter: createNativeImageAdapter(),
  }
}
function providerAdapter(provider: PhotoProvider): ImageAdapter {
  return (photo, context) => {
    const src = context === 'thumb' ? (photo.thumbSrc ?? photo.src) : photo.src
    return {
      src: provider.url(src, { width: photo.width }),
      srcset: provider.srcset?.(photo, context),
      placeholderSrc: photo.placeholderSrc ?? provider.placeholder?.(src),
      width: photo.width,
      height: photo.height,
    }
  }
}
/** Install setup-time config. Nuxt supplies its legacy adapter and reactive locale internally. */
export function createPhotoPlugin(
  config: PhotoConfig,
  adapter?: ImageAdapter,
  locale?: () => string | undefined,
): Plugin {
  validatePhotoConfig(config)
  return {
    install(app) {
      app.provide(
        photoConfigKey,
        computed(() => {
          const base = defaults(locale?.())
          if (adapter) base.imageAdapter = adapter
          return mergePhotoConfig(base, config)
        }),
      )
    },
  }
}
export function createPhoto(config: PhotoConfig): Plugin {
  return createPhotoPlugin(config)
}
export function usePhotoConfig(): ComputedRef<ResolvedPhotoConfig> {
  const instance = getCurrentInstance()
  return (
    (instance && localConfigs.get(instance)) ||
    inject(
      photoConfigKey,
      computed(() => defaults()),
    )
  )
}
export function providePhotoConfig(overrides: () => PhotoConfig): ComputedRef<ResolvedPhotoConfig> {
  const parent = usePhotoConfig()
  const config = computed(() => mergePhotoConfig(parent.value, overrides()))
  const instance = getCurrentInstance()
  if (instance) localConfigs.set(instance, config)
  provide(photoConfigKey, config)
  return config
}
export function isLightboxOptions(
  value: boolean | Component | LightboxOptions | undefined,
): value is LightboxOptions {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(
      'setup' in value ||
      'render' in value ||
      'template' in value ||
      '__vccOpts' in value ||
      'name' in value
    )
  )
}
