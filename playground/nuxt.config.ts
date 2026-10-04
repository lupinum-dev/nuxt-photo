import NuxtImage from '@nuxt/image'
import NuxtPhoto from '@lupinum/nuxt-photo'

export default defineNuxtConfig({
  // Imported modules exercise the order-sensitive case that setup-time detection misses.
  modules: [NuxtPhoto, NuxtImage, 'nuxt-shiki'],

  nuxtPhoto: {
    css: 'all',
  },

  image: {
    // Small carousel thumbnails need small entries in Nuxt Image's canonical ladder.
    screens: { xs: 128, small: 256, medium: 384 },
    quality: 80,
  },

  shiki: {
    defaultTheme: 'vitesse-dark',
    defaultLang: 'vue',
  },

  // Nuxt Image's generated #build import must stay inside the dev SSR transform.
  vite: { ssr: { noExternal: ['@nuxt/image'] } },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-25',
})
