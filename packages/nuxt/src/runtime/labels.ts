import type { PhotoLabels } from '@lupinum/vue-photo/provide'
import type { NuxtPhotoLabelsConfig } from '../options'

function expand(template: string, values: Readonly<Record<string, number>>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  )
}

export function resolveNuxtPhotoLabels(raw?: NuxtPhotoLabelsConfig): Partial<PhotoLabels> {
  if (!raw) return {}
  const { goToSlide, viewPhoto, slideStatus, ...staticLabels } = raw
  const labels: Partial<PhotoLabels> = { ...staticLabels }
  if (goToSlide !== undefined) {
    labels.goToSlide = (index) => expand(goToSlide, { index })
  }
  if (viewPhoto !== undefined) {
    labels.viewPhoto = (index) => expand(viewPhoto, { index })
  }
  if (slideStatus !== undefined) {
    labels.slideStatus = (index, count) => expand(slideStatus, { index, count })
  }
  return labels
}
