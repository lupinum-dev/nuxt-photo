import NuxtImage from '@nuxt/image'
import NuxtPhoto from '@lupinum/nuxt-photo'

export default defineNuxtConfig({
  // Imported modules exercise the order-sensitive case that setup-time detection misses.
  modules: [NuxtPhoto, NuxtImage, 'nuxt-shiki'],

  nuxtPhoto: {
    css: 'all',
    image: {
      provider: 'nuxt-image',
    },
  },

  shiki: {
    defaultTheme: 'vitesse-dark',
    defaultLang: 'vue',
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-25',
})
