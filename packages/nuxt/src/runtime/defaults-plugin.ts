import { defineNuxtPlugin, type Plugin, useAppConfig } from '#app'
import { PhotoDefaultsKey } from '@lupinum/vue-photo/provide'
import { resolveNuxtPhotoLabels } from './labels'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  const config = useAppConfig().nuxtPhoto
  const minZoom = config?.lightbox?.minZoom
  const labels = resolveNuxtPhotoLabels(config?.labels)

  if (minZoom == null && Object.keys(labels).length === 0) return
  nuxtApp.vueApp.provide(PhotoDefaultsKey, {
    ...(minZoom != null ? { minZoom } : {}),
    ...(Object.keys(labels).length > 0 ? { labels } : {}),
  })
}

export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
