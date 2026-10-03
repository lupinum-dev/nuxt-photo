import type { NuxtApp } from '#app'
import type { ImageAdapter } from '@lupinum/vue-photo'
import { createPhotoPlugin } from '#build/nuxt-photo-internals.mjs'
import options from '#build/nuxt-photo-options.mjs'
import { dimensions, hasI18n } from '#build/nuxt-photo-config.mjs'
import { resolveNuxtPhotoLabels, resolveNuxtPhotoLocale } from './labels'

export function installNuxtPhoto(nuxtApp: NuxtApp, adapter?: ImageAdapter) {
  const labels =
    typeof options.labels === 'string' ? options.labels : resolveNuxtPhotoLabels(options.labels)
  const locale = () => resolveNuxtPhotoLocale(hasI18n ? nuxtApp.$i18n : undefined)
  nuxtApp.vueApp.use(
    createPhotoPlugin(
      { labels, lightbox: options.lightbox, validation: options.validation, dimensions },
      adapter,
      locale,
    ),
  )
}
