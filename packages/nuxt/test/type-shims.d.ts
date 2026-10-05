declare module '#app' {
  export { defineNuxtPlugin, useAppConfig, useAsyncData, useRequestFetch } from 'nuxt/app'
  // Nuxt normally generates the built-in app runtime config fields.
  export function useRuntimeConfig(): import('@nuxt/schema').RuntimeConfig & {
    app: { baseURL: string; buildAssetsDir: string; cdnURL: string }
  }
  export type { NuxtApp, Plugin } from 'nuxt/app'
}

declare module '#imports' {
  export { useHead } from 'nuxt/app'
  export { defineNuxtPlugin } from 'nuxt/app'
  export function useImage(): import('../src/runtime/provider').NuxtImageFunction & {
    options: import('../src/runtime/provider').NuxtImageOptions
  }
}

declare module '#build/nuxt-photo-local-images.mjs' {
  const dimensions: Readonly<Record<string, import('../src/local-images').LocalImage>>
  export default dimensions
}
