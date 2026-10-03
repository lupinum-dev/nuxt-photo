import { defineNuxtPlugin, type NuxtApp } from '#app'
import { useImage } from '#imports'
import options from '#build/nuxt-photo-options.mjs'
import { createNuxtImageAdapter } from './image-adapter'
import { installNuxtPhoto } from './install'

export default defineNuxtPlugin({
  name: 'nuxt-photo:config',
  setup(nuxtApp: NuxtApp) {
    const image = useImage()
    const config = typeof options.image === 'object' ? options.image : undefined
    const provider = options.provider ?? image.options.provider
    const adapter = createNuxtImageAdapter(
      (src, modifiers) => image(src, modifiers, { provider }),
      config,
      provider,
    )
    installNuxtPhoto(nuxtApp, adapter)
  },
})
