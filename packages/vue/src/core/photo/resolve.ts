import { normalizePhotos, type InvalidPhotoPolicy, type InvalidPhotosEvent } from './normalize'
import type { PhotoItem } from '../types'

export type ResolveRecipePhotosOptions = {
  validation?: InvalidPhotoPolicy
  onInvalidPhotos?: (event: InvalidPhotosEvent) => void
}

export function resolveRecipePhotos<TMeta extends object = Readonly<Record<string, unknown>>>(
  rawPhotos: readonly unknown[],
  owner: string,
  options: ResolveRecipePhotosOptions = {},
): PhotoItem<TMeta>[] {
  const validation = options.validation ?? 'throw'
  const result = normalizePhotos<TMeta>(rawPhotos, {
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
