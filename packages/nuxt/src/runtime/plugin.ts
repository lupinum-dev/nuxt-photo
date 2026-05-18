import { defineNuxtPlugin, type NuxtApp, useAppConfig } from '#app'
import { useImage } from '#imports'
import { ImageAdapterKey } from '@nuxt-photo/vue'
import { createNuxtImageAdapter } from './image-adapter'

export default defineNuxtPlugin({
  name: 'nuxt-photo:image-adapter',
  setup(nuxtApp: NuxtApp) {
    const image = useImage()
    const config = useAppConfig().nuxtPhoto?.image

    nuxtApp.vueApp.provide(
      ImageAdapterKey,
      createNuxtImageAdapter(image, config),
    )
  },
})
