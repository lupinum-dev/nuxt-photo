import { defineNuxtPlugin } from '#app'
import { ImageAdapterKey } from '@nuxt-photo/vue'
import { createNuxtImageAdapter } from './nuxtImageAdapter'

export default defineNuxtPlugin((nuxtApp) => {
  const adapter = createNuxtImageAdapter()
  nuxtApp.vueApp.provide(ImageAdapterKey, adapter)
})
