import { defineNuxtModule, addComponent, addImports, addPluginTemplate, hasNuxtModule } from '@nuxt/kit'

// Re-export core types so consumers can import from '@nuxt-photo/nuxt'
export type { PhotoItem, ImageAdapter, ImageContext, ImageSource, LayoutGroup, LayoutEntry, BentoSizing } from '@nuxt-photo/core'
export type { LightboxContext, PhotoGroupContext } from '@nuxt-photo/vue'

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
      provider: undefined,
    },
  },
  setup(options, _nuxt) {
    // Prevent Vite from pre-bundling workspace packages that contain .vue files.
    // Vite's optimizer can't handle .vue re-exports in ESM dist files, which causes
    // components like PhotoImage to resolve as undefined in the optimized bundle.
    _nuxt.hook('vite:extendConfig', (config) => {
      const excluded = ['@nuxt-photo/vue', '@nuxt-photo/recipes', '@nuxt-photo/core']
      const existing = config.optimizeDeps?.exclude ?? []
      config.optimizeDeps = {
        ...config.optimizeDeps,
        exclude: [...new Set([...existing, ...excluded])],
      }
    })

    // Auto-detect @nuxt/image or respect explicit provider config
    const useNuxtImage =
      options.image?.provider === 'nuxt-image' ||
      (options.image?.provider !== 'native' && hasNuxtModule('@nuxt/image'))

    if (useNuxtImage) {
      // Use addPluginTemplate so the plugin lives in .nuxt/ virtual filesystem
      // where #image (registered by @nuxt/image) is already aliased by Vite.
      // Using addPlugin with a pre-built file causes Vite pre-transform to fail
      // because it sees `import { useImage } from "#image"` before @nuxt/image
      // has registered the alias.
      // Use addPluginTemplate so the plugin lives in .nuxt/ virtual filesystem.
      // Avoid `import { useImage } from '#image'` because Vite 7 treats '#'-prefixed
      // imports as Node.js package imports (resolved via the 'imports' field) rather
      // than Nuxt aliases, causing a pre-transform error. Instead we access $img from
      // the nuxtApp context, which @nuxt/image provides via its own plugin.
      // @nuxt/image v2: useImage() caches the helper on nuxtApp._img and provides it as
      // nuxtApp.$img via its plugin. We call useNuxtApp() at render time (not at plugin
      // setup time) to always get the fully-initialised app and access $img / _img.
      addPluginTemplate({
        filename: 'nuxt-photo-image-adapter.mjs',
        getContents: () => `
import { defineNuxtPlugin, useNuxtApp } from '#app'
import { ImageAdapterKey } from '@nuxt-photo/vue'

export default defineNuxtPlugin({
  name: 'nuxt-photo:image-adapter',
  enforce: 'post',
  setup(nuxtApp) {
    const adapter = (photo, context) => {
      // @nuxt/image sets $img (via plugin provide) and _img (via useImage() cache).
      // Resolve at call-time so we never capture a stale / pre-init reference.
      const app = useNuxtApp()
      const img = app.$img || app._img
      const src = (context === 'thumb' && photo.thumbSrc) ? photo.thumbSrc : photo.src
      if (!img) {
        // @nuxt/image not available — fall back to plain src
        return { src, width: photo.width, height: photo.height }
      }
      if (context === 'preload') {
        return { src: img(src, { width: 1600, quality: 85 }), width: photo.width, height: photo.height }
      }
      const sizes = context === 'slide'
        ? '100vw'
        : '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 400px'
      const quality = context === 'slide' ? 85 : 80
      const result = img.getSizes(src, { sizes, quality })
      return { src: result.src, srcset: result.srcset, sizes: result.sizes, width: photo.width, height: photo.height }
    }
    nuxtApp.vueApp.provide(ImageAdapterKey, adapter)
  },
})
`.trimStart(),
      })
    }

    // Register recipe components
    if (options.components !== false) {
      const prefix = typeof options.components === 'object' ? options.components.prefix || '' : ''

      const components = [
        { name: 'Photo', from: '@nuxt-photo/recipes' },
        { name: 'PhotoGroup', from: '@nuxt-photo/recipes' },
        { name: 'PhotoAlbum', from: '@nuxt-photo/recipes' },
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
        'LightboxCaption',
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
        { name: 'computeBentoLayout', from: '@nuxt-photo/core' },
      ])
    }

    // CSS registration
    if (options.css === 'default') {
      _nuxt.options.css.push('@nuxt-photo/recipes/styles/lightbox.css')
    }
  },
})
