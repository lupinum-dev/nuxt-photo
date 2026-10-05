import { inject, watch } from 'vue'
import type { LightboxOptions } from '../../config'
import { devWarn } from '../../core/env'
import { PhotoGroupContextKey } from '../photo-group/context'

export function useRecipeLightbox(
  owner: string,
  option: () => boolean | LightboxOptions | undefined,
) {
  const group = inject(PhotoGroupContextKey, null)
  let warned = false
  if (group) {
    watch(
      option,
      (value) => {
        if (value === undefined || warned) return
        warned = true
        devWarn(`${owner} ignores its lightbox option because PhotoGroup owns the lightbox.`)
      },
      { immediate: true },
    )
  }
  return {
    group,
    options: () => {
      const value = option()
      return !group && typeof value === 'object' ? value : undefined
    },
  }
}
