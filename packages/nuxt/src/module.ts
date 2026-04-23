import {
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
export type { PhotoItem } from '@nuxt-photo/core'

export interface NuxtPhotoOptions {
  autoImports?: boolean | { prefix?: string }
  components?: boolean | { prefix?: string }
  css?: 'none' | 'structure' | 'all'
  image?:
    | false
    | {
        provider?: 'auto' | 'nuxt-image' | 'native' | 'custom'
      }
  lightbox?: {
    minZoom?: number
  }
}

type NuxtPhotoAppConfig = {
  nuxtPhoto?: {
    lightbox?: {
      minZoom?: number
    }
  }
}

// Recipe components — registered as `{prefix}{name}` (e.g. `Photo`, `PhotoAlbum`, or `NpPhoto`, `NpPhotoAlbum`)
const RECIPE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'Photo', name: 'Photo' },
  { export: 'PhotoGroup', name: 'PhotoGroup' },
  { export: 'PhotoAlbum', name: 'PhotoAlbum' },
  { export: 'PhotoCarousel', name: 'PhotoCarousel' },
]
// Primitive components — registered as `{prefix}{name}`
const PRIMITIVE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'LightboxRoot', name: 'LightboxRoot' },
  { export: 'LightboxOverlay', name: 'LightboxOverlay' },
  { export: 'LightboxViewport', name: 'LightboxViewport' },
  { export: 'LightboxSlide', name: 'LightboxSlide' },
  { export: 'LightboxControls', name: 'LightboxControls' },
  { export: 'LightboxCaption', name: 'LightboxCaption' },
  { export: 'LightboxPortal', name: 'LightboxPortal' },
  { export: 'PhotoTrigger', name: 'PhotoTrigger' },
  { export: 'PhotoImage', name: 'PhotoImage' },
]

const AUTO_IMPORTS = [
  'useLightbox',
  'useLightboxProvider',
  'responsive',
] as const

function capitalize(name: string) {
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

function resolveAutoImportAlias(name: string, prefix: string) {
  if (!prefix) {
    return name
  }

  if (name.startsWith('use')) {
    return `use${prefix}${name.slice(3)}`
  }

  return `${prefix.charAt(0).toLowerCase()}${prefix.slice(1)}${capitalize(name)}`
}

export default defineNuxtModule<NuxtPhotoOptions>({
  meta: {
    name: '@nuxt-photo/nuxt',
    configKey: 'nuxtPhoto',
    compatibility: {
      nuxt: '^4.0.0',
    },
  },
  defaults: {
    autoImports: true,
    components: {
      prefix: '',
    },
    css: 'structure',
    image: {
      provider: 'auto',
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    const minZoom = options.lightbox?.minZoom

    if (options.image !== false) {
      const explicit = options.image?.provider ?? 'auto'
      const imageProvider =
        explicit === 'auto'
          ? hasNuxtModule('@nuxt/image')
            ? 'nuxt-image'
            : 'native'
          : explicit

      if (imageProvider === 'nuxt-image') {
        if (!hasNuxtModule('@nuxt/image')) {
          throw new Error(
            '[nuxt-photo] `nuxtPhoto.image.provider = "nuxt-image"` requires `@nuxt/image` to be installed in `modules`.',
          )
        }

        nuxt.hook('modules:done', () => {
          addPlugin(
            {
              src: resolve('./runtime/plugin'),
            },
            { append: true },
          )
        })
      }
    }

    if (minZoom != null) {
      const appConfig = nuxt.options.appConfig as NuxtPhotoAppConfig

      appConfig.nuxtPhoto = {
        ...appConfig.nuxtPhoto,
        lightbox: {
          ...appConfig.nuxtPhoto?.lightbox,
          minZoom,
        },
      }

      addPlugin(
        {
          src: resolve('./runtime/defaults-plugin'),
        },
        { append: true },
      )
    }

    if (options.components !== false) {
      const prefix =
        typeof options.components === 'object'
          ? (options.components.prefix ?? '')
          : ''

      for (const component of RECIPE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: '@nuxt-photo/recipes',
        })
      }

      for (const component of PRIMITIVE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: '@nuxt-photo/vue',
        })
      }
    }

    if (options.autoImports) {
      const prefix =
        typeof options.autoImports === 'object'
          ? (options.autoImports.prefix ?? '')
          : ''

      addImports(
        AUTO_IMPORTS.map((name) => ({
          name,
          as: resolveAutoImportAlias(name, prefix),
          from: '@nuxt-photo/vue',
        })),
      )
    }

    const structureCSS = [
      '@nuxt-photo/recipes/styles/lightbox-structure.css',
      '@nuxt-photo/recipes/styles/album.css',
      '@nuxt-photo/recipes/styles/photo-structure.css',
      '@nuxt-photo/recipes/styles/carousel-structure.css',
    ]
    const themeCSS = [
      '@nuxt-photo/recipes/styles/lightbox-theme.css',
      '@nuxt-photo/recipes/styles/photo.css',
      '@nuxt-photo/recipes/styles/carousel-theme.css',
    ]

    const cssFiles =
      options.css === 'all'
        ? [...structureCSS, ...themeCSS]
        : options.css === 'structure'
          ? structureCSS
          : []

    for (const css of cssFiles) {
      if (!nuxt.options.css.includes(css)) {
        nuxt.options.css.push(css)
      }
    }
  },
}) as NuxtModule<NuxtPhotoOptions>
