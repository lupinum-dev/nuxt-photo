import { defineNuxtPlugin, type Plugin, useAppConfig } from '#app'
import { LightboxDefaultsKey } from '@lupinum/vue-photo/provide'

const nuxtPhotoDefaultsPlugin: Plugin = (nuxtApp): void => {
  const lightbox = useAppConfig().nuxtPhoto?.lightbox

  if (lightbox?.minZoom != null) {
    nuxtApp.vueApp.provide(LightboxDefaultsKey, {
      minZoom: lightbox.minZoom,
    })
  }
}

export default defineNuxtPlugin(nuxtPhotoDefaultsPlugin)
