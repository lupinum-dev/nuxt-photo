import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import {
  addComponent,
  addTemplate,
  updateTemplates,
  addImports,
  addPlugin,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  useLogger,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { NUXT_PHOTO_DEFAULTS, validateNuxtPhotoOptions, type NuxtPhotoOptions } from './options'
import { readLocalImageDimensions } from './local-images'
export type { NuxtPhotoOptions } from './options'

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
  { export: 'LightboxAmbient', name: 'LightboxAmbient' },
  { export: 'LightboxViewport', name: 'LightboxViewport' },
  { export: 'LightboxSlide', name: 'LightboxSlide' },
  { export: 'LightboxControls', name: 'LightboxControls' },
  { export: 'LightboxCaption', name: 'LightboxCaption' },
  { export: 'PhotoTrigger', name: 'PhotoTrigger' },
  { export: 'PhotoImage', name: 'PhotoImage' },
]

const AUTO_IMPORTS = ['useLightbox', 'provideLightbox', 'usePhotoLabels', 'responsive'] as const

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

    const logger = useLogger('nuxt-photo')
    const resolver = createResolver(import.meta.url)
    const vueDistDir = dirname(await resolver.resolvePath('@lupinum/vue-photo'))

    addTemplate({
      filename: 'nuxt-photo-internals.mjs',
      getContents: () =>
        `export { createPhotoPlugin } from ${JSON.stringify(resolve(vueDistDir, 'config/index.mjs'))}`,
    })
    addTemplate({
      filename: 'nuxt-photo-options.mjs',
      getContents: () =>
        `export default ${JSON.stringify({ labels: options.labels, lightbox: options.lightbox, validation: options.validation, provider: options.provider })}`,
    })

    if (options.localImages) {
      // Nuxt 4 schema resolves dir.public against rootDir, independently of srcDir.
      const publicDir = resolve(nuxt.options.rootDir, nuxt.options.dir.public)
      let dimensions = await readLocalImageDimensions(publicDir, logger)
      const template = addTemplate({
        filename: 'nuxt-photo-local-images.mjs',
        getContents: () => `export default Object.freeze(${JSON.stringify(dimensions)})`,
      })
      // The config plugin owns dimensions as well as the other defaults.
      if (nuxt.options.dev) {
        if (!nuxt.options.watch.includes(publicDir)) nuxt.options.watch.push(publicDir)
        nuxt.hook('builder:watch', async (_event, path) => {
          const changed = resolve(nuxt.options.srcDir, path)
          const withinPublic = relative(publicDir, changed)
          if (
            withinPublic === '' ||
            (withinPublic !== '..' &&
              !withinPublic.startsWith('..' + sep) &&
              !isAbsolute(withinPublic))
          ) {
            dimensions = await readLocalImageDimensions(publicDir, logger)
            await updateTemplates({
              filter: (candidate) => candidate.filename === template.filename,
            })
          }
        })
      }
    }

    nuxt.hook('modules:done', () => {
      addTemplate({
        filename: 'nuxt-photo-config.mjs',
        getContents:
          () => `${options.localImages ? "import manifest from '#build/nuxt-photo-local-images.mjs'" : ''}
import { createLocalImageDimensionsResolver } from ${JSON.stringify(resolver.resolve('./runtime/local-image-dimensions'))}
export const dimensions = ${options.localImages ? 'createLocalImageDimensionsResolver(manifest, ' + JSON.stringify(nuxt.options.app.baseURL) + ')' : 'undefined'}
export const hasI18n = ${hasNuxtModule('@nuxtjs/i18n')}`,
      })
    })
    nuxt.hook('modules:done', () => {
      if (hasNuxtModule('@nuxt/image')) {
        addPlugin({ src: resolver.resolve('./runtime/plugin') }, { append: true })
      } else {
        if (options.provider)
          throw new TypeError(
            '[nuxt-photo] nuxtPhoto.provider requires @nuxt/image; install the module or omit the provider name.',
          )
        addPlugin({ src: resolver.resolve('./runtime/defaults-plugin') }, { append: true })
      }
    })

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
