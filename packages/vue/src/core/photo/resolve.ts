import { normalizePhotos, type InvalidPhotoPolicy, type InvalidPhotosEvent } from './normalize'
import type { PhotoItem } from '../types'

export type ResolveRecipePhotosOptions = {
  validation?: InvalidPhotoPolicy
  onInvalidPhotos?: (event: InvalidPhotosEvent) => void
}

export function resolveRecipePhotos(
  rawPhotos: readonly unknown[],
  owner: string,
  options: ResolveRecipePhotosOptions = {},
): PhotoItem[] {
  const validation = options.validation ?? 'throw'
  const result = normalizePhotos(rawPhotos, {
    owner,
    onInvalid: validation,
  })

  if (result.issues.length > 0) {
    const event = {
      owner,
      issues: result.issues,
      rawPhotos,
    }

    options.onInvalidPhotos?.(event)
  }

  return result.photos
}
