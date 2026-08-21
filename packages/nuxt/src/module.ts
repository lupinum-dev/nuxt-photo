import { dirname, resolve } from 'node:path'
import {
  addComponent,
  addImports,
  addPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  logger,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { NUXT_PHOTO_DEFAULTS, validateNuxtPhotoOptions, type NuxtPhotoOptions } from './options'
export type { NuxtPhotoAppConfig, NuxtPhotoLabels, NuxtPhotoOptions } from './options'

// Recipe components — registered as `{prefix}{name}` (e.g. `Photo`, `PhotoAlbum`, or `NpPhoto`, `NpPhotoAlbum`)
const RECIPE_COMPONENTS: Array<{ export: string; name: string }> = [
  { export: 'Lightbox', name: 'Lightbox' },
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
  'provideLightbox',
  'usePhotoLabels',
  'providePhotoLabels',
  'responsive',
] as const

function hasAdapterConfig(image: NuxtPhotoOptions['image']) {
  return typeof image === 'object' && (image.thumb !== undefined || image.slide !== undefined)
}

function resolveRecipeComponent(vueDistDir: string, name: string) {
  return resolve(vueDistDir, 'components', `${name}.vue`)
}

function resolvePrimitiveComponent(vueDistDir: string, name: string) {
  return resolve(vueDistDir, 'primitives', `${name}.vue`)
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
    name: '@lupinum/nuxt-photo',
    configKey: 'nuxtPhoto',
    compatibility: {
      nuxt: '^4.4.8',
    },
  },
  defaults: NUXT_PHOTO_DEFAULTS,
  async setup(options, nuxt) {
    validateNuxtPhotoOptions(options)

    const resolver = createResolver(import.meta.url)
    const vueDistDir = dirname(await resolver.resolvePath('@lupinum/vue-photo'))

    if (nuxt.options.appConfig.nuxtPhoto) {
      addPlugin(
        {
          src: resolver.resolve('./runtime/defaults-plugin'),
        },
        { append: true },
      )
    }

    if (options.image !== false) {
      const explicit = options.image?.provider ?? 'auto'
      const adapterConfig =
        typeof options.image === 'object'
          ? { thumb: options.image.thumb, slide: options.image.slide }
          : {}

      if (explicit === 'native') {
        if (hasAdapterConfig(options.image)) {
          logger.warn(
            '[nuxt-photo] `nuxtPhoto.image.thumb` and `slide` require the Nuxt Image adapter and are ignored in native mode.',
          )
        }
      } else {
        nuxt.hook('modules:done', () => {
          const hasImageModule = hasNuxtModule('@nuxt/image')
          if (explicit === 'nuxt-image' && !hasImageModule) {
            throw new Error(
              '[nuxt-photo] `nuxtPhoto.image.provider = "nuxt-image"` requires `@nuxt/image` to be installed in `modules`.',
            )
          }

          if (!hasImageModule) {
            if (hasAdapterConfig(options.image)) {
              logger.warn(
                '[nuxt-photo] Nuxt Image adapter settings cannot take effect because `@nuxt/image` is not installed; using native images.',
              )
            }
            return
          }

          addTemplate({
            filename: 'nuxt-photo/image-config.mjs',
            getContents: () => `export default ${JSON.stringify(adapterConfig)}`,
          })

          addPlugin(
            {
              src: resolver.resolve('./runtime/plugin'),
            },
            { append: true },
          )
        })
      }
    }

    if (options.components !== false) {
      const prefix = typeof options.components === 'object' ? (options.components.prefix ?? '') : ''

      for (const component of RECIPE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          filePath: resolveRecipeComponent(vueDistDir, component.export),
        })
      }

      const registerPrimitives =
        typeof options.components === 'object' && options.components.primitives

      if (registerPrimitives) {
        for (const component of PRIMITIVE_COMPONENTS) {
          addComponent({
            name: `${prefix}${component.name}`,
            filePath: resolvePrimitiveComponent(vueDistDir, component.export),
          })
        }
      }
    }

    if (options.autoImports) {
      const prefix =
        typeof options.autoImports === 'object' ? (options.autoImports.prefix ?? '') : ''

      addImports(
        AUTO_IMPORTS.map((name) => ({
          name,
          as: resolveAutoImportAlias(name, prefix),
          from: '@lupinum/nuxt-photo/app',
        })),
      )
    }

    const structureCSS = [
      resolve(vueDistDir, 'styles/lightbox-structure.css'),
      resolve(vueDistDir, 'styles/album.css'),
      resolve(vueDistDir, 'styles/photo-structure.css'),
      resolve(vueDistDir, 'styles/carousel-structure.css'),
    ]
    const themeCSS = [
      resolve(vueDistDir, 'styles/lightbox-theme.css'),
      resolve(vueDistDir, 'styles/photo.css'),
      resolve(vueDistDir, 'styles/carousel-theme.css'),
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
