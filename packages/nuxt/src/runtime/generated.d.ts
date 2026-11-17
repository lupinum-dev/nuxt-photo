declare module '#build/nuxt-photo-options.mjs' {
  const options: Omit<import('../options').NuxtPhotoOptions, 'lightbox'> & {
    lightbox?: import('@lupinum/vue-photo').LightboxOptions
  }
  export default options
}
declare module '#build/nuxt-photo-config.mjs' {
  export const dimensions: import('@lupinum/vue-photo').PhotoConfig['dimensions']
  export function decorateProvider(
    provider: import('@lupinum/vue-photo').PhotoProvider,
  ): import('@lupinum/vue-photo').PhotoProvider
  export const hasI18n: boolean
}
