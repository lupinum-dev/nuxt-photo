import type { PhotoLabels } from '@lupinum/vue-photo/provide'
import type { NuxtPhotoLabels } from '../options'

function interpolate(template: string, index: number, count?: number) {
  return template
    .replaceAll('{index}', String(index))
    .replaceAll('{count}', count === undefined ? '{count}' : String(count))
}

/** Convert serializable AppConfig labels into Vue's callable indexed labels. */
export function resolveNuxtPhotoLabels(labels?: NuxtPhotoLabels): Partial<PhotoLabels> | undefined {
  if (!labels) return undefined

  const { counter, goToSlide, viewPhoto, ...staticLabels } = labels

  return {
    ...staticLabels,
    ...(counter !== undefined && {
      counter: (index, count) => interpolate(counter, index, count),
    }),
    ...(goToSlide !== undefined && {
      goToSlide: (index) => interpolate(goToSlide, index),
    }),
    ...(viewPhoto !== undefined && {
      viewPhoto: (index) => interpolate(viewPhoto, index),
    }),
  }
}
