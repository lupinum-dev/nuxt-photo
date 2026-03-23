/**
 * Public composable wrapper around the headless lightbox runtime.
 * It resolves image items and translates the public module options into internal runtime options.
 */
import { computed, toValue } from 'vue'
import { useLightbox } from '../../lightbox/composables/useLightbox'
import type { UsePhotoLightboxConfig } from '../../types'
import { normalizeLightboxOptions, useResolvedLightboxItems } from '../utils/lightbox'

/** Create a reusable lightbox controller for custom integrations. */
export function usePhotoLightbox(config: UsePhotoLightboxConfig) {
  const items = useResolvedLightboxItems(
    () => toValue(config.items),
    () => toValue(config.options),
    () => toValue(config.image),
  )

  return useLightbox({
    items,
    options: computed(() => normalizeLightboxOptions(toValue(config.options))),
    getThumbnailElement: computed(() => {
      if (typeof config.getThumbnailElement === 'function' && config.getThumbnailElement.length > 0) {
        return config.getThumbnailElement as (index: number, item: (typeof items.value)[number]) => HTMLElement | null | undefined
      }

      return toValue(config.getThumbnailElement) ?? undefined
    }),
  })
}
