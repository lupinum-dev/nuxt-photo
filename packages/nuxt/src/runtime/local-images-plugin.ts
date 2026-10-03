import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { PhotoDimensionsKey } from '@lupinum/vue-photo'
import dimensions from '#build/nuxt-photo-local-images.mjs'
import { createLocalImageDimensionsResolver } from './local-image-dimensions'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(
    PhotoDimensionsKey,
    createLocalImageDimensionsResolver(dimensions, useRuntimeConfig().app.baseURL),
  )
})
