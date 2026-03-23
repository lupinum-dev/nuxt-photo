import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [MyModule],
  compatibilityDate: '2025-01-01',
  nuxtPhoto: {
    features: {
      img: false,
      album: false,
      lightbox: true,
    },
  },
})
