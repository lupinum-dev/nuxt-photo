import {
  normalizePhotos,
  type InvalidPhotoPolicy,
  type InvalidPhotosEvent,
  type PhotoItem,
  type PhotoMapper,
} from '../core/index'
import { devWarn } from './runtime'

export type ResolveRecipePhotosOptions = {
  validation?: InvalidPhotoPolicy
  onInvalidPhotos?: (event: InvalidPhotosEvent) => void
}

export function resolveRecipePhotos(
  rawPhotos: readonly unknown[],
  mapper: PhotoMapper | undefined,
  owner: string,
  options: ResolveRecipePhotosOptions = {},
): PhotoItem[] {
  const validation = options.validation ?? 'throw'
  const result = normalizePhotos(rawPhotos, {
    owner,
    mapper,
    onInvalid: validation === 'warn' ? 'drop' : validation,
  })

  if (result.issues.length > 0) {
    const event = {
      owner,
      issues: result.issues,
      rawPhotos,
    }

    options.onInvalidPhotos?.(event)

    if (validation === 'warn') {
      devWarn(
        `${owner}: dropped ${result.issues.length} invalid photo issue(s)`,
        result.issues,
      )
    }
  }

  return result.photos
}
