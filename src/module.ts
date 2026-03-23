import type { Nuxt } from '@nuxt/schema'
import {
  addComponent,
  addImports,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
} from '@nuxt/kit'
import type { LightboxModuleConfig } from './runtime/types'

/**
 * Nuxt module options for `nuxt-photo`.
 *
 * These options control which runtime surfaces are registered, which CSS is injected,
 * and how the lightbox integrates with `@nuxt/image`.
 */
export interface ModuleOptions {
  css?: boolean | {
    img?: boolean
    album?: boolean
    lightbox?: boolean
  }
  features?: {
    img?: boolean
    album?: boolean
    lightbox?: boolean
  }
  prefix?: string
  lightbox?: LightboxModuleConfig
}

export {
  PhotoImage,
  PhotoAlbum,
  PhotoGallery,
  PhotoImg,
  PhotoLightbox,
} from './runtime/exports'
export { usePhotoLightbox } from './runtime/app/composables/usePhotoLightbox'
export { usePhotoAlbumLayout } from './runtime/app/composables/usePhotoAlbumLayout'
export { usePhotoGroup } from './runtime/app/composables/usePhotoGroup'
export { useContainerWidth } from './runtime/app/composables/useContainerWidth'
export type * from './runtime/types'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-photo',
    configKey: 'nuxtPhoto',
    compatibility: {
      nuxt: '^4.4.2',
    },
  },
  defaults: {
    css: true,
    prefix: 'Photo',
    features: {
      img: true,
      album: true,
      lightbox: true,
    },
    lightbox: {
      densities: 'x1 x2',
      maxWidth: 2560,
    },
  },
  setup(options: ModuleOptions, nuxt: Nuxt) {
    const resolver = createResolver(import.meta.url)
    const runtimeDir = resolver.resolve('./runtime')
    const hasNuxtImage = hasNuxtModule('@nuxt/image')
    const prefix = options.prefix || 'Photo'
    const imageComponentPath = hasNuxtImage
      ? resolver.resolve('./runtime/app/components/NuxtPhotoNuxtImage.vue')
      : resolver.resolve('./runtime/app/components/NuxtPhotoNativeImage.vue')

    const features = {
      img: options.features?.img !== false,
      album: options.features?.album !== false,
      lightbox: options.features?.lightbox !== false,
    }

    if (!nuxt.options.build.transpile.includes(runtimeDir)) {
      nuxt.options.build.transpile.push(runtimeDir)
    }

    nuxt.options.runtimeConfig.public.nuxtPhoto = {
      ...(nuxt.options.runtimeConfig.public.nuxtPhoto as Record<string, unknown> | undefined),
      hasNuxtImage,
      lightbox: {
        densities: options.lightbox?.densities ?? 'x1 x2',
        maxWidth: options.lightbox?.maxWidth ?? 2560,
        preset: options.lightbox?.preset,
      },
    }

    const cssConfig = options.css
    const cssEnabled = cssConfig !== false
    const cssFeatures = typeof cssConfig === 'object' && cssConfig !== null
      ? cssConfig
      : { img: cssEnabled, album: cssEnabled, lightbox: cssEnabled }

    const cssEntries: string[] = []

    if (features.img && cssFeatures.img !== false) {
      cssEntries.push(resolver.resolve('./runtime/styles/nuxt-photo-img.css'))
    }

    if (features.album && cssFeatures.album !== false) {
      cssEntries.push(resolver.resolve('./runtime/styles/nuxt-photo-album.css'))
    }

    if (features.lightbox && cssFeatures.lightbox !== false) {
      cssEntries.push(resolver.resolve('./runtime/styles/nuxt-photo-lightbox.css'))
    }

    for (const cssEntry of cssEntries) {
      if (!nuxt.options.css.includes(cssEntry)) {
        nuxt.options.css.push(cssEntry)
      }
    }

    if (features.album) {
      addComponent({
        name: `${prefix}Album`,
        filePath: resolver.resolve('./runtime/app/components/NuxtPhotoAlbum.vue'),
      })
    }

    if (features.img) {
      addComponent({
        name: `${prefix}Img`,
        filePath: resolver.resolve('./runtime/app/components/NuxtPhotoImg.vue'),
      })
    }

    if (features.lightbox) {
      addComponent({
        name: `${prefix}Gallery`,
        filePath: resolver.resolve('./runtime/app/components/NuxtPhotoGallery.vue'),
      })

      addComponent({
        name: `${prefix}Lightbox`,
        filePath: resolver.resolve('./runtime/app/components/NuxtPhotoLightbox.vue'),
      })
    }

    if (features.img || features.album) {
      addComponent({
        name: `${prefix}Image`,
        filePath: imageComponentPath,
      })
    }

    if (features.lightbox) {
      addImports({
        from: resolver.resolve('./runtime/app/composables/usePhotoLightbox'),
        name: 'usePhotoLightbox',
      })

      addImports({
        from: resolver.resolve('./runtime/app/composables/usePhotoGroup'),
        name: 'usePhotoGroup',
      })
    }

    if (features.album) {
      addImports({
        from: resolver.resolve('./runtime/app/composables/usePhotoAlbumLayout'),
        name: 'usePhotoAlbumLayout',
      })
    }

    addImports({
      from: resolver.resolve('./runtime/app/composables/useContainerWidth'),
      name: 'useContainerWidth',
    })
  },
})
