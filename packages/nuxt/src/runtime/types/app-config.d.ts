type NuxtPhotoLightboxAppConfig = {
  image?: {
    thumb?: {
      sizes?: string
      quality?: number
    }
    slide?: {
      widths?: number[]
      maxWidth?: number
      maxDensity?: number
      sizes?: string
      quality?: number
    }
  }
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
