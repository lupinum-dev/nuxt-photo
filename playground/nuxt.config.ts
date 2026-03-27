export default defineNuxtConfig({
  modules: ['@nuxt/image', '@nuxt-photo/nuxt', 'nuxt-shiki'],

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
