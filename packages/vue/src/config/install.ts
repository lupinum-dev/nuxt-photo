import { computed, type App } from 'vue'
import {
  defaultPhotoConfig,
  mergePhotoConfig,
  photoConfigKey,
  type PhotoConfig,
  type ResolvedPhotoConfig,
} from './index'
import type { ProviderRuntime } from '../providers/runtime'
import { installLightboxHistoryListener } from '../lightbox/historyEvents'

// Runs before router setup, without retaining the gallery or lightbox runtime.
installLightboxHistoryListener()

/** Internal installation: the caller validates config at its Vue or Nuxt setup boundary. */
export function installPhotoConfig(
  app: App,
  config: PhotoConfig,
  providers?: ProviderRuntime,
  locale?: () => string | undefined,
  environment?: Pick<ResolvedPhotoConfig, 'initialUrl' | 'teleportTarget'>,
): void {
  app.provide(
    photoConfigKey,
    computed(() => {
      const base = defaultPhotoConfig(locale?.())
      if (providers) base.providers = providers
      return { ...mergePhotoConfig(base, config), ...environment }
    }),
  )
}
