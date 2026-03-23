import { computed } from 'vue'
import type { LightboxConfig, LightboxOptions } from '../../types'
import { normalizeLightboxOptions } from '../utils/lightbox'

export function useLightboxConfig(lightbox: () => LightboxConfig | undefined) {
  const lightboxEnabled = computed(() => lightbox() !== false)
  const lightboxOptions = computed<LightboxOptions | undefined>(() =>
    typeof lightbox() === 'object' ? (lightbox() as LightboxOptions) : undefined,
  )
  const internalLightboxOptions = computed(() =>
    normalizeLightboxOptions(lightboxOptions.value),
  )

  return { internalLightboxOptions, lightboxEnabled, lightboxOptions }
}
