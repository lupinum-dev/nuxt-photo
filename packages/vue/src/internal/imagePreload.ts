import type { App, InjectionKey } from 'vue'

type ImagePreload = (image: { src: string; srcset?: string; sizes: string }) => void
export const ImagePreloadKey: InjectionKey<ImagePreload> = Symbol('nuxt-photo:image-preload')

// Nuxt installs this internal hook; plain Vue has no head integration.
export function installImagePreload(app: App, preload: ImagePreload) {
  app.provide(ImagePreloadKey, preload)
}
