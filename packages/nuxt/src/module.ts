import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule, hasNuxtModule } from '@nuxt/kit'

export interface NuxtPhotoOptions {
  autoImports?: boolean
  components?: boolean | { prefix?: string }
  css?: 'none' | 'default'
  image?: {
    provider?: 'nuxt-image' | 'native' | 'custom'
  }
}

// Maps export name → component name suffix (drops redundant "Photo" prefix from recipes)
const RECIPE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'Photo', name: 'Image' },
  { export: 'PhotoGroup', name: 'Group' },
  { export: 'PhotoAlbum', name: 'Album' },
  { export: 'PhotoGallery', name: 'Gallery' },
]
const PRIMITIVE_COMPONENTS = [
  'LightboxRoot',
  'LightboxOverlay',
  'LightboxViewport',
  'LightboxSlide',
  'LightboxControls',
  'LightboxCaption',
  'LightboxPortal',
  'PhotoTrigger',
  'PhotoImage',
] as const

const AUTO_IMPORTS = ['useLightbox'] as const

export default defineNuxtModule<NuxtPhotoOptions>({
  meta: {
    name: '@nuxt-photo/nuxt',
    configKey: 'nuxtPhoto',
    compatibility: {
      nuxt: '^3.21.2',
    },
  },
  defaults: {
    autoImports: true,
    components: {
      prefix: 'NuxtPhoto',
    },
    css: 'default',
    image: {
      provider: 'native',
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const imageProvider = options.image?.provider ?? 'native'

    if (imageProvider === 'nuxt-image') {
      if (!hasNuxtModule('@nuxt/image')) {
        throw new Error('[nuxt-photo] `nuxtPhoto.image.provider = "nuxt-image"` requires `@nuxt/image` to be installed in `modules`.')
      }

      nuxt.hook('modules:done', () => {
        addPlugin({
          src: resolve('./runtime/plugin'),
        }, { append: true })
      })
    }

    if (options.components !== false) {
      const prefix = typeof options.components === 'object' ? options.components.prefix || 'NuxtPhoto' : 'NuxtPhoto'

      for (const component of RECIPE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: '@nuxt-photo/recipes',
        })
      }

      for (const component of PRIMITIVE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component}`,
          export: component,
          filePath: '@nuxt-photo/vue',
        })
      }
    }

    if (options.autoImports) {
      addImports(AUTO_IMPORTS.map(name => ({ name, from: '@nuxt-photo/vue' })))
    }

    if (options.css === 'default') {
      for (const css of [
        '@nuxt-photo/recipes/styles/lightbox-structure.css',
        '@nuxt-photo/recipes/styles/lightbox-theme.css',
        '@nuxt-photo/recipes/styles/album.css',
      ]) {
        if (!nuxt.options.css.includes(css)) {
          nuxt.options.css.push(css)
        }
      }
    }
  },
})
