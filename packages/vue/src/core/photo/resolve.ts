import { normalizePhotos, type InvalidPhotoPolicy, type InvalidPhotosEvent } from './normalize'
import type { PhotoItem } from '../types'

export type ResolveRecipePhotosOptions = {
  validation?: InvalidPhotoPolicy
}

export type ResolveRecipePhotosResult<TMeta extends object = Readonly<Record<string, unknown>>> = {
  readonly photos: PhotoItem<TMeta>[]
  readonly invalidPhotos: InvalidPhotosEvent | null
}

export function resolveRecipePhotos<TMeta extends object = Readonly<Record<string, unknown>>>(
  rawPhotos: readonly unknown[],
  owner: string,
  options: ResolveRecipePhotosOptions = {},
): ResolveRecipePhotosResult<TMeta> {
  const validation = options.validation ?? 'throw'
  const result = normalizePhotos<TMeta>(rawPhotos, {
    owner,
    onInvalid: validation,
  })

  return {
    photos: result.photos,
    invalidPhotos:
      result.issues.length > 0
        ? {
            owner,
            issues: result.issues,
            rawPhotos,
          }
        : null,
  }
}
