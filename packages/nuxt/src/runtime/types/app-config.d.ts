import type { NuxtPhotoRuntimeConfig } from '../../module.mjs'

declare module '@nuxt/schema' {
  interface CustomAppConfig {
    nuxtPhoto?: NuxtPhotoRuntimeConfig
  }

  interface AppConfig {
    nuxtPhoto?: NuxtPhotoRuntimeConfig
  }
}

declare module 'nuxt/schema' {
  interface CustomAppConfig {
    nuxtPhoto?: NuxtPhotoRuntimeConfig
  }

  interface AppConfig {
    nuxtPhoto?: NuxtPhotoRuntimeConfig
  }
}

export {}
