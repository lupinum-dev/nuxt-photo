import type { PhotoProvider } from '../config'

export const DEFAULT_WIDTHS = [256, 384, 512, 640, 828, 1080, 1280, 1640, 1920, 2560] as const
/** Nuxt supplies transport constraints; the core alone builds image candidates. */
export interface ProviderRuntime {
  resolve(name: string): PhotoProvider
  widths(provider: PhotoProvider): readonly number[]
  allowSourceWidth(provider: PhotoProvider): boolean
}
export const defaultProviderRuntime: ProviderRuntime = {
  resolve(name) {
    throw new TypeError(
      `[nuxt-photo] Provider name "${name}" requires Nuxt Image; pass a PhotoProvider object in Vue.`,
    )
  },
  widths: () => DEFAULT_WIDTHS,
  allowSourceWidth: () => true,
}
