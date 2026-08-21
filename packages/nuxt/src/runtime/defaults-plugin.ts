import { defineNuxtPlugin, type Plugin, useAppConfig } from '#app'
import { LightboxDefaultsKey, type PhotoLabels } from '@lupinum/vue-photo/provide'

/** Expand an `{index}` placeholder template into a label function. */
function expandTemplate(template: string): (index: number) => string {
  return (index) => template.replace('{index}', String(index))
}

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  const config = useAppConfig().nuxtPhoto
  const minZoom = config?.lightbox?.minZoom
  const rawLabels = config?.labels

  if (minZoom == null && !rawLabels) return

  const labels: Partial<PhotoLabels> = {}
  if (rawLabels) {
    if (rawLabels.photoViewer !== undefined) labels.photoViewer = rawLabels.photoViewer
    if (rawLabels.previous !== undefined) labels.previous = rawLabels.previous
    if (rawLabels.next !== undefined) labels.next = rawLabels.next
    if (rawLabels.zoom !== undefined) labels.zoom = rawLabels.zoom
    if (rawLabels.fit !== undefined) labels.fit = rawLabels.fit
    if (rawLabels.close !== undefined) labels.close = rawLabels.close
    if (rawLabels.loadFailed !== undefined) labels.loadFailed = rawLabels.loadFailed
    if (rawLabels.previousSlide !== undefined) labels.previousSlide = rawLabels.previousSlide
    if (rawLabels.nextSlide !== undefined) labels.nextSlide = rawLabels.nextSlide
    if (rawLabels.goToSlide !== undefined) labels.goToSlide = expandTemplate(rawLabels.goToSlide)
    if (rawLabels.viewPhoto !== undefined) labels.viewPhoto = expandTemplate(rawLabels.viewPhoto)
  }

  nuxtApp.vueApp.provide(LightboxDefaultsKey, {
    ...(minZoom != null ? { minZoom } : {}),
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
  })
}

export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
