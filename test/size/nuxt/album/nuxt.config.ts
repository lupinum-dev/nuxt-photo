export default defineNuxtConfig({
  alias: {
    '@lupinum/nuxt-photo': process.env.NUXT_PHOTO_SIZE_MODULE_PATH!,
  },
  modules: ['@lupinum/nuxt-photo'],
})
