import { fileURLToPath } from 'node:url'
import {
  addComponent,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import {
  NUXT_PHOTO_DEFAULTS,
  validateNuxtPhotoOptions,
  type NuxtPhotoOptions,
} from './options'
export type { NuxtPhotoOptions } from './options'

type NuxtPhotoAppConfig = {
  nuxtPhoto?: {
    image?: Exclude<NuxtPhotoOptions['image'], false>
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
  { export: 'LightboxProvider', name: 'LightboxProvider' },
  { export: 'LightboxRoot', name: 'LightboxRoot' },
  { export: 'LightboxOverlay', name: 'LightboxOverlay' },
  { export: 'LightboxViewport', name: 'LightboxViewport' },
  { export: 'LightboxSlide', name: 'LightboxSlide' },
  { export: 'LightboxControls', name: 'LightboxControls' },
  { export: 'LightboxCaption', name: 'LightboxCaption' },
  { export: 'PhotoTrigger', name: 'PhotoTrigger' },
  { export: 'PhotoImage', name: 'PhotoImage' },
]

const AUTO_IMPORTS = [
  'useLightbox',
  'useLightboxProvider',
  'responsive',
] as const

const packageRoots = [
  fileURLToPath(new URL('..', import.meta.url)),
  fileURLToPath(new URL('../../vue', import.meta.url)),
]

function resolveRecipeComponent(name: string) {
  return fileURLToPath(
    new URL(`../../vue/dist/components/${name}.vue`, import.meta.url),
  )
}

function resolvePrimitiveComponent(name: string) {
  return fileURLToPath(
    new URL(`../../vue/dist/primitives/${name}.vue`, import.meta.url),
  )
}

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
  defaults: NUXT_PHOTO_DEFAULTS,
  setup(options, nuxt) {
    validateNuxtPhotoOptions(options)

    const { resolve } = createResolver(import.meta.url)
    const minZoom = options.lightbox?.minZoom

    nuxt.options.vite.server ??= {}
    nuxt.options.vite.server.fs ??= {}
    const allow = nuxt.options.vite.server.fs.allow ?? []

    for (const root of packageRoots) {
      if (!allow.includes(root)) {
        allow.push(root)
      }
    }

    nuxt.options.vite.server.fs.allow = allow

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

      if (imageProvider === 'nuxt-image' && typeof options.image === 'object') {
        const appConfig = nuxt.options.appConfig as NuxtPhotoAppConfig
        appConfig.nuxtPhoto = {
          ...appConfig.nuxtPhoto,
          image: {
            ...appConfig.nuxtPhoto?.image,
            thumb: options.image.thumb,
            slide: options.image.slide,
          },
        }
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
          filePath: resolveRecipeComponent(component.export),
        })
      }

      const registerPrimitives =
        typeof options.components === 'object' && options.components.primitives

      if (registerPrimitives) {
        for (const component of PRIMITIVE_COMPONENTS) {
          addComponent({
            name: `${prefix}${component.name}`,
            filePath: resolvePrimitiveComponent(component.export),
          })
        }
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
          from: '@nuxt-photo/nuxt/app',
        })),
      )
    }

    const structureCSS = [
      fileURLToPath(
        new URL(
          '../../vue/dist/styles/lightbox-structure.css',
          import.meta.url,
        ),
      ),
      fileURLToPath(
        new URL('../../vue/dist/styles/album.css', import.meta.url),
      ),
      fileURLToPath(
        new URL('../../vue/dist/styles/photo-structure.css', import.meta.url),
      ),
      fileURLToPath(
        new URL(
          '../../vue/dist/styles/carousel-structure.css',
          import.meta.url,
        ),
      ),
    ]
    const themeCSS = [
      fileURLToPath(
        new URL('../../vue/dist/styles/lightbox-theme.css', import.meta.url),
      ),
      fileURLToPath(
        new URL('../../vue/dist/styles/photo.css', import.meta.url),
      ),
      fileURLToPath(
        new URL('../../vue/dist/styles/carousel-theme.css', import.meta.url),
      ),
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
