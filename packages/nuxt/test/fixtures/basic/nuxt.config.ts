import NuxtPhoto from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtPhoto],
  nuxtPhoto: {
    lightbox: {
      minZoom: 1.2,
    },
  },
})
