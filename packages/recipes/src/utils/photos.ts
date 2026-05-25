import {
  normalizePhotos,
  type PhotoItem,
  type PhotoMapper,
} from '@nuxt-photo/core'
import { isDev } from './runtime'

export function resolveRecipePhotos(
  rawPhotos: PhotoItem[] | any[],
  mapper: PhotoMapper | undefined,
  owner: string,
): PhotoItem[] {
  return normalizePhotos(rawPhotos, {
    owner,
    mapper,
    onInvalid: isDev() ? 'throw' : 'drop',
  }).photos
}
