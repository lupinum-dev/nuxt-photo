export default defineNuxtConfig({
  modules: ['@nuxt-photo/nuxt', '@nuxt/image', 'nuxt-shiki'],

  photo: {
    css: 'default',
  },

  shiki: {
    defaultTheme: 'vitesse-dark',
    defaultLang: 'vue',
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-25',
})
