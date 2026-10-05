import {
  computed,
  getCurrentInstance,
  inject,
  provide,
  type Component,
  type ComputedRef,
  type InjectionKey,
} from 'vue'
import { nativeProvider } from '../providers/native'
import { defaultProviderRuntime, type ProviderRuntime } from '../providers/runtime'
import type { LightboxNavigationMode, LightboxTransitionOption, PhotoItem } from '../core/types'
import { DEFAULT_MIN_ZOOM } from '../core/viewer/zoom'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
import type { PhotoLabels, PhotoLocale } from '../provide/labels'

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
  dimensions?: (
    src: string,
  ) => { width: number; height: number; _placeholderColor?: string } | undefined
}
export interface ResolvedPhotoConfig extends Omit<
  PhotoConfig,
  'labels' | 'lightbox' | 'validation'
> {
  labels: Partial<PhotoLabels>
  labelLocale?: string
  lightbox: LightboxOptions
  validation: InvalidPhotoPolicy
  provider: PhotoProvider
  providers: ProviderRuntime
  /** Nuxt supplies the request URL and its SSR teleport destination internally. */
  initialUrl?: string
  teleportTarget?: string
}
export const photoConfigKey: InjectionKey<ComputedRef<ResolvedPhotoConfig>> =
  Symbol('nuxt-photo:config')
// Vue inject() reads ancestors, so retain the current recipe config for its setup consumers.
const localConfigs = new WeakMap<object, ComputedRef<ResolvedPhotoConfig>>()

function definedEntries(value: object) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined))
}

export function mergePhotoConfig(
  parent: ResolvedPhotoConfig,
  overrides: PhotoConfig,
): ResolvedPhotoConfig {
  const defined = definedEntries(overrides)
  return {
    ...parent,
    ...defined,
    labelLocale: typeof overrides.labels === 'string' ? overrides.labels : parent.labelLocale,
    labels:
      typeof overrides.labels === 'string'
        ? {}
        : { ...parent.labels, ...definedEntries(overrides.labels ?? {}) },
    lightbox: {
      ...parent.lightbox,
      ...definedEntries(overrides.lightbox ?? {}),
    },
  }
}
export function defaultPhotoConfig(locale?: string): ResolvedPhotoConfig {
  return {
    labels: {},
    labelLocale: locale,
    lightbox: { minZoom: DEFAULT_MIN_ZOOM, transition: 'auto', navigation: 'slide', history: true },
    validation: 'throw',
    provider: nativeProvider,
    providers: defaultProviderRuntime,
  }
}
export function usePhotoConfig(): ComputedRef<ResolvedPhotoConfig> {
  const instance = getCurrentInstance()
  return (
    (instance && localConfigs.get(instance)) ||
    inject(
      photoConfigKey,
      computed(() => defaultPhotoConfig()),
    )
  )
}
export function providePhotoConfig(
  overrides: () => Omit<PhotoConfig, 'provider'> & { provider?: PhotoProvider | string },
): ComputedRef<ResolvedPhotoConfig> {
  const parent = usePhotoConfig()
  const config = computed(() => {
    const value = overrides()
    return mergePhotoConfig(parent.value, {
      ...value,
      provider:
        typeof value.provider === 'string'
          ? parent.value.providers.resolve(value.provider)
          : value.provider,
    })
  })
  const instance = getCurrentInstance()
  if (instance) localConfigs.set(instance, config)
  provide(photoConfigKey, config)
  return config
}
