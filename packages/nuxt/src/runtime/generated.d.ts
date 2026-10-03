declare module '#build/nuxt-photo-internals.mjs' {
  export function createPhotoPlugin(
    config: import('@lupinum/vue-photo').PhotoConfig,
    adapter?: import('@lupinum/vue-photo').ImageAdapter,
    locale?: () => string | undefined,
  ): import('vue').Plugin
}
declare module '#build/nuxt-photo-options.mjs' {
  const options: import('../options').NuxtPhotoOptions
  export default options
}
declare module '#build/nuxt-photo-config.mjs' {
  export const dimensions: import('@lupinum/vue-photo').PhotoConfig['dimensions']
  export const hasI18n: boolean
}
