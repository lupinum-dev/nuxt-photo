import type { NuxtApp } from '#app'
import type { PhotoProvider } from '@lupinum/vue-photo'
import type { ProviderRuntime } from './provider'
import { createPhotoPlugin } from '#build/nuxt-photo-internals.mjs'
import options from '#build/nuxt-photo-options.mjs'
import { dimensions, hasI18n } from '#build/nuxt-photo-config.mjs'
import { resolveNuxtPhotoLabels, resolveNuxtPhotoLocale } from './labels'

export function installNuxtPhoto(
  nuxtApp: NuxtApp,
  provider?: PhotoProvider,
  providers?: ProviderRuntime,
) {
  const labels =
    typeof options.labels === 'string' ? options.labels : resolveNuxtPhotoLabels(options.labels)
  const locale = () => resolveNuxtPhotoLocale(hasI18n ? nuxtApp.$i18n : undefined)
  nuxtApp.vueApp.use(
    createPhotoPlugin(
      { provider, labels, lightbox: options.lightbox, validation: options.validation, dimensions },
      providers,
      locale,
    ),
  )
}
