import { defineNuxtModule, addComponent, addImports, createResolver } from '@nuxt/kit'

export interface NuxtPhotoOptions {
  autoImports?: boolean
  components?: boolean | { prefix?: string }
  css?: 'none' | 'structural' | 'default'
  image?: {
    provider?: 'nuxt-image' | 'native' | 'custom'
  }
}

export default defineNuxtModule<NuxtPhotoOptions>({
  meta: {
    name: '@nuxt-photo/nuxt',
    configKey: 'photo',
  },
  defaults: {
    autoImports: true,
    components: true,
    css: 'default',
    image: {
      provider: 'native',
    },
  },
  setup(options, _nuxt) {
    const resolver = createResolver(import.meta.url)

    // Register recipe components
    if (options.components !== false) {
      const prefix = typeof options.components === 'object' ? options.components.prefix || '' : ''

      const components = [
        { name: 'Photo', from: '@nuxt-photo/recipes' },
        { name: 'PhotoAlbum', from: '@nuxt-photo/recipes' },
        { name: 'PhotoGallery', from: '@nuxt-photo/recipes' },
        { name: 'Lightbox', from: '@nuxt-photo/recipes' },
      ]

      for (const component of components) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.name,
          filePath: component.from,
        })
      }

      // Headless primitives
      const primitives = [
        'LightboxRoot',
        'LightboxOverlay',
        'LightboxViewport',
        'LightboxSlide',
        'LightboxControls',
        'LightboxPortal',
        'PhotoTrigger',
        'PhotoImage',
      ]

      for (const name of primitives) {
        addComponent({
          name: `${prefix}${name}`,
          export: name,
          filePath: '@nuxt-photo/vue',
        })
      }
    }

    // Auto-import composables
    if (options.autoImports) {
      addImports([
        { name: 'useLightbox', from: '@nuxt-photo/vue' },
        { name: 'useCarousel', from: '@nuxt-photo/vue' },
        { name: 'usePanzoom', from: '@nuxt-photo/vue' },
        { name: 'useGestures', from: '@nuxt-photo/vue' },
        { name: 'useGhostTransition', from: '@nuxt-photo/vue' },
      ])

      // Core utilities
      addImports([
        { name: 'createCollection', from: '@nuxt-photo/core' },
        { name: 'computeRowsLayout', from: '@nuxt-photo/core' },
        { name: 'computeColumnsLayout', from: '@nuxt-photo/core' },
        { name: 'computeMasonryLayout', from: '@nuxt-photo/core' },
        { name: 'createNativeImageAdapter', from: '@nuxt-photo/core' },
      ])
    }

    // CSS registration
    if (options.css === 'default') {
      _nuxt.options.css.push('@nuxt-photo/recipes/styles/lightbox.css')
    }
  },
})
