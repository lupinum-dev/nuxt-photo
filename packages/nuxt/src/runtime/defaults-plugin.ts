import { defineNuxtPlugin, type Plugin, useAppConfig } from '#app'
import { LightboxDefaultsKey, PhotoLabelsKey, resolvePhotoLabels } from '@lupinum/vue-photo/provide'
import { computed } from 'vue'
import { resolveNuxtPhotoLabels } from './labels'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  const appConfig = useAppConfig()
  const lightbox = appConfig.nuxtPhoto?.lightbox

  nuxtApp.vueApp.provide(
    PhotoLabelsKey,
    computed(() => resolvePhotoLabels(resolveNuxtPhotoLabels(appConfig.nuxtPhoto?.labels))),
  )

  if (lightbox?.minZoom != null) {
    nuxtApp.vueApp.provide(LightboxDefaultsKey, {
      minZoom: lightbox.minZoom,
    })
  }
}

export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
