import { computed, type App } from 'vue'
import { defaultPhotoConfig, mergePhotoConfig, photoConfigKey, type PhotoConfig } from './index'
import type { ProviderRuntime } from '../providers/runtime'

/** Internal installation: the caller validates config at its Vue or Nuxt setup boundary. */
export function installPhotoConfig(
  app: App,
  config: PhotoConfig,
  providers?: ProviderRuntime,
  locale?: () => string | undefined,
): void {
  app.provide(
    photoConfigKey,
    computed(() => {
      const base = defaultPhotoConfig(locale?.())
      if (providers) base.providers = providers
      return mergePhotoConfig(base, config)
    }),
  )
}
