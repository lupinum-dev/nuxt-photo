import { computed } from 'vue'
import { usePhotoConfig } from '../config'
import { detectPhotoLocale, PHOTO_LABELS, type PhotoLabels } from '../provide/labels'

/** Read each label lazily, retaining reactive locale and per-key overrides. */
export function usePhotoLabels(): PhotoLabels {
  const config = usePhotoConfig()
  const defaults = computed(() => PHOTO_LABELS[detectPhotoLocale(config.value.labelLocale)])
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
