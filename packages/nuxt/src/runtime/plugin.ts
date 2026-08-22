import { defineNuxtPlugin, type NuxtApp } from '#app'
import imageConfig from '#build/nuxt-photo/image-config.mjs'
import { useImage } from '#imports'
import { ImageAdapterKey } from '@lupinum/vue-photo/provide'
import { createNuxtImageAdapter } from './image-adapter'

export default defineNuxtPlugin({
  name: 'nuxt-photo:image-adapter',
  setup(nuxtApp: NuxtApp) {
    const image = useImage()

    nuxtApp.vueApp.provide(ImageAdapterKey, createNuxtImageAdapter(image, imageConfig))
  },
})
