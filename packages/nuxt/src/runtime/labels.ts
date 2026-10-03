import { unref } from 'vue'
import type { PhotoLabels } from '@lupinum/vue-photo'
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

/** Read the optional i18n global composer without depending on its package. */
export function resolveNuxtPhotoLocale(i18n: unknown): string {
  if (typeof i18n === 'object' && i18n !== null && 'locale' in i18n) {
    const value: unknown = unref(i18n.locale)
    if (typeof value === 'string') return value
  }
  return 'en'
}
