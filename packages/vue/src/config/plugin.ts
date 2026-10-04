import { computed, type Plugin } from 'vue'
import { defaultPhotoConfig, mergePhotoConfig, photoConfigKey, type PhotoConfig } from './index'
import type { ProviderRuntime } from '../providers/runtime'
import { validatePhotoConfig } from './validate'

/** Install setup-time config. Nuxt supplies its provider environment and reactive locale internally. */
export function createPhotoPlugin(
  config: PhotoConfig,
  providers?: ProviderRuntime,
  locale?: () => string | undefined,
): Plugin {
  validatePhotoConfig(config)
  return {
    install(app) {
      app.provide(
        photoConfigKey,
        computed(() => {
          const base = defaultPhotoConfig(locale?.())
          if (providers) base.providers = providers
          return mergePhotoConfig(base, config)
        }),
      )
    },
  }
}
export function createPhoto(config: PhotoConfig): Plugin {
  return createPhotoPlugin(config)
}
