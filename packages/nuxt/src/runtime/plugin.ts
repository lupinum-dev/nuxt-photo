import { defineNuxtPlugin, type NuxtApp } from '#app'
import { useImage } from '#imports'
import options from '#build/nuxt-photo-options.mjs'
import { createNuxtPhotoProviders } from './provider'
import { installNuxtPhoto } from './install'

export default defineNuxtPlugin({
  name: 'nuxt-photo:config',
  setup(nuxtApp: NuxtApp) {
    const image = useImage()
    const providers = createNuxtPhotoProviders(image, image.options)
    installNuxtPhoto(
      nuxtApp,
      providers.resolve(options.provider ?? image.options.provider),
      providers.runtime,
    )
  },
})
