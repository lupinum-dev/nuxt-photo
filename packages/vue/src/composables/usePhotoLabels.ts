import { useLabels } from '../provide/labels'
import { resolvePhotoLabels } from '../provide/viewerLabels'
import type { PhotoLabels } from '../provide/labelTypes'

/** Read each label lazily, retaining reactive locale and per-key overrides. */
export function usePhotoLabels(): PhotoLabels {
  return useLabels(resolvePhotoLabels)
}
