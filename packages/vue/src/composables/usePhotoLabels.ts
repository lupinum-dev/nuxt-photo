import { usePhotoConfig } from '../config'
import type { PhotoLabels } from '../provide/labels'

/** Complete labels from the nearest merged config, including reactive Nuxt locale changes. */
export function usePhotoLabels(): PhotoLabels {
  const config = usePhotoConfig()
  return new Proxy(
    { ...config.value.labels },
    {
      get: (_target, key: keyof PhotoLabels) => config.value.labels[key],
    },
  )
}
