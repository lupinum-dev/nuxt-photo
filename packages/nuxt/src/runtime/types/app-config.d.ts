type NuxtPhotoLightboxAppConfig = {
  lightbox?: {
    minZoom?: number
  }
}

declare module '@nuxt/schema' {
  interface CustomAppConfig {
    nuxtPhoto?: NuxtPhotoLightboxAppConfig
  }

  interface AppConfig {
    nuxtPhoto?: NuxtPhotoLightboxAppConfig
  }
}

declare module 'nuxt/schema' {
  interface CustomAppConfig {
    nuxtPhoto?: NuxtPhotoLightboxAppConfig
  }

  interface AppConfig {
    nuxtPhoto?: NuxtPhotoLightboxAppConfig
  }
}

export {}
