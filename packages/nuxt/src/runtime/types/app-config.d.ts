import type { NuxtPhotoAppConfig } from '../../module.mjs'

declare module '@nuxt/schema' {
  interface AppConfig {
    nuxtPhoto?: NuxtPhotoAppConfig
  }
}

declare module 'nuxt/schema' {
  interface AppConfig {
    nuxtPhoto?: NuxtPhotoAppConfig
  }
}

export {}
