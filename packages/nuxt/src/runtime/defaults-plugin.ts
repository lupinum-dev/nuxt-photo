import { defineNuxtPlugin, type Plugin, useAppConfig } from '#app'
import { PhotoDefaultsKey } from '@lupinum/vue-photo/provide'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  const lightbox = useAppConfig().nuxtPhoto?.lightbox

  if (lightbox?.minZoom != null) {
    nuxtApp.vueApp.provide(PhotoDefaultsKey, {
      minZoom: lightbox.minZoom,
    })
  }
}

export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
