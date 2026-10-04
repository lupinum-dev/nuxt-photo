import NuxtPhoto from '../../../src/module'
export default defineNuxtConfig({
  modules: [NuxtPhoto],
  dir: { public: '../local-images/public' },
  nuxtPhoto: { localImages: false },
  nitro: { prerender: { routes: ['/folder'], failOnError: true } },
})
