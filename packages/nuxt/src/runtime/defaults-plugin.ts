import { defineNuxtPlugin, type NuxtApp, useAppConfig } from '#app'
import { LightboxDefaultsKey } from '@nuxt-photo/vue'

export default defineNuxtPlugin({
  name: 'nuxt-photo:defaults',
  setup(nuxtApp: NuxtApp) {
    const config = useAppConfig() as {
      nuxtPhoto?: {
        lightbox?: {
          minZoom?: number
        }
      }
    }
    const lightbox = config.nuxtPhoto?.lightbox

    if (lightbox?.minZoom != null) {
      nuxtApp.vueApp.provide(LightboxDefaultsKey, { minZoom: lightbox.minZoom })
    }
  },
})
