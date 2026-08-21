import { inject } from 'vue'
import { LightboxDefaultsKey } from '../provide/keys'
import { resolvePhotoLabels, type PhotoLabels } from '../provide/labels'

/** Return a complete label set, with English defaults for omitted values. */
export function usePhotoLabels(): PhotoLabels {
  const defaults = inject(LightboxDefaultsKey, undefined)
  return resolvePhotoLabels(defaults?.labels)
}
