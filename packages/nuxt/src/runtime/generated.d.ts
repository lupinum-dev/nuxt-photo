declare module '#build/nuxt-photo-internals.mjs' {
  export interface ProviderRuntime {
    resolve(name: string): import('@lupinum/vue-photo').PhotoProvider
    widths(provider: import('@lupinum/vue-photo').PhotoProvider): readonly number[]
    allowSourceWidth(provider: import('@lupinum/vue-photo').PhotoProvider): boolean
  }
  export function installPhotoConfig(
    app: import('vue').App,
    config: import('@lupinum/vue-photo').PhotoConfig,
    providers?: ProviderRuntime,
    locale?: () => string | undefined,
  ): void
}
declare module '#build/nuxt-photo-options.mjs' {
  const options: import('../options').NuxtPhotoOptions
  export default options
}
declare module '#build/nuxt-photo-config.mjs' {
  export const dimensions: import('@lupinum/vue-photo').PhotoConfig['dimensions']
  export const hasI18n: boolean
}
