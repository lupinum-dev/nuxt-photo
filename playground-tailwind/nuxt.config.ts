import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: ['@lupinum/nuxt-photo'],

  nuxtPhoto: {
    css: 'structure',
  },

  css: ['./assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-25',
})
