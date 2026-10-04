import { computed } from 'vue'
import { usePhotoConfig } from '../config'
import { resolvePhotoLabels, type PhotoLabels } from '../provide/labels'

/** Read each label lazily, retaining reactive locale and per-key overrides. */
export function usePhotoLabels(): PhotoLabels {
  const config = usePhotoConfig()
  const defaults = computed(() => resolvePhotoLabels(config.value.labelLocale))
  return new Proxy(
    { ...defaults.value, ...config.value.labels },
    {
      get: (_target, key: keyof PhotoLabels) => {
        const override = config.value.labels[key]
        return override === undefined ? defaults.value[key] : override
      },
    },
  )
}
