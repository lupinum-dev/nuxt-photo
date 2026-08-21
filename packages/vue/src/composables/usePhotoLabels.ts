import { inject } from 'vue'
import { LightboxDefaultsKey } from '../provide/keys'
import { DEFAULT_PHOTO_LABELS, resolvePhotoLabels, type PhotoLabels } from '../provide/labels'

/**
 * Resolve the UI labels in effect for the current component tree.
 *
 * Reads the optional `labels` field from app-level `LightboxDefaults` and
 * merges it over the built-in English defaults. Safe to call outside any
 * lightbox context — always returns a complete label set.
 */
export function usePhotoLabels(): PhotoLabels {
  const defaults = inject(LightboxDefaultsKey, undefined)
  return resolvePhotoLabels(defaults?.labels)
}

export { DEFAULT_PHOTO_LABELS, resolvePhotoLabels }
export type { PhotoLabels }
