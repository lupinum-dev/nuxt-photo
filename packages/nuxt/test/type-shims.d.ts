declare module '#app' {
  export { defineNuxtPlugin, useAppConfig } from 'nuxt/app'
  export type { NuxtApp, Plugin } from 'nuxt/app'
}

declare module '#imports' {
  import type { NuxtImageFunction } from '../src/runtime/image-adapter'
  export function useImage(): NuxtImageFunction
}
