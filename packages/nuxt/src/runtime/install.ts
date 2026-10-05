import type { NuxtApp } from '#app'
import type { PhotoProvider } from '@lupinum/vue-photo'
import type { ProviderRuntime } from './provider'
import {
  installImagePreload,
  installPhotoConfig,
  nativeProvider,
} from '#build/nuxt-photo-internals.mjs'
import { useHead } from '#imports'
import options from '#build/nuxt-photo-options.mjs'
import { dimensions, hasI18n, decorateProvider } from '#build/nuxt-photo-config.mjs'
import { resolveNuxtPhotoLabels, resolveNuxtPhotoLocale } from './labels'

export function installNuxtPhoto(
  nuxtApp: NuxtApp,
  provider?: PhotoProvider,
  providers?: ProviderRuntime,
) {
  if (import.meta.server) {
    const preloaded = new Set<string>()
    installImagePreload(nuxtApp.vueApp, ({ src, srcset, sizes }) => {
      const key = srcset ?? src
      if (preloaded.has(key) || preloaded.size >= 6) return
      preloaded.add(key)
      useHead({
        link: [
          {
            rel: 'preload',
            as: 'image',
            imagesrcset: srcset,
            imagesizes: sizes,
            href: srcset ? undefined : src,
            fetchpriority: 'high',
            key,
          },
        ],
      })
    })
  }
  const labels =
    typeof options.labels === 'string' ? options.labels : resolveNuxtPhotoLabels(options.labels)
  const locale = () => resolveNuxtPhotoLocale(hasI18n ? nuxtApp.$i18n : undefined)
  let runtime = providers
  if (dimensions) {
    const originals = new WeakMap<PhotoProvider, PhotoProvider>()
    const decorate = (value: PhotoProvider) => {
      const wrapped = decorateProvider(value)
      originals.set(wrapped, value)
      return wrapped
    }
    provider = decorate(provider ?? nativeProvider)
    if (providers)
      runtime = {
        resolve: (name: string) => decorate(providers.resolve(name)),
        widths: (value: PhotoProvider) => providers.widths(originals.get(value) ?? value),
        allowSourceWidth: (value: PhotoProvider) =>
          providers.allowSourceWidth(originals.get(value) ?? value),
      }
  }
  installPhotoConfig(
    nuxtApp.vueApp,
    { provider, labels, lightbox: options.lightbox, validation: options.validation, dimensions },
    runtime,
    locale,
    { initialUrl: nuxtApp.ssrContext?.url, teleportTarget: '#teleports' },
  )
}
