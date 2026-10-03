import NuxtPhoto from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtPhoto],
  app: { baseURL: '/gallery/' },
  nuxtPhoto: { localImages: true },
})
