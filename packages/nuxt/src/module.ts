import { isAbsolute, relative, resolve, sep } from 'node:path'
import { stat } from 'node:fs/promises'
import {
  addComponent,
  addTemplate,
  addServerTemplate,
  addServerHandler,
  updateTemplates,
  addImports,
  addPlugin,
  createResolver,
  resolvePath,
  defineNuxtModule,
  hasNuxtModule,
  useLogger,
  useNitro,
} from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'
import { NUXT_PHOTO_DEFAULTS, validateNuxtPhotoOptions, type NuxtPhotoOptions } from './options'
import { readLocalImages } from './local-images'
import { generatePhotoLocales, LABEL_CATALOGS } from './locales'
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
]

const AUTO_IMPORTS = ['useLightbox', 'usePhotoLabels', 'usePhotoFolder', 'responsive'] as const

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

function registerPrimitives(options: NuxtPhotoOptions) {
  return typeof options.components === 'object' && !!options.components.primitives
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

    let lightboxComponent: string | undefined
    if (options.lightbox?.component !== undefined) {
      try {
        lightboxComponent = await resolvePath(options.lightbox.component)
        // resolvePath returns normalized input when no file exists.
        if (!(await stat(lightboxComponent)).isFile()) throw new Error('Not a file')
      } catch (cause) {
        throw new TypeError(
          `[nuxt-photo] \`nuxtPhoto.lightbox.component\` could not resolve ${JSON.stringify(options.lightbox.component)}; use an existing component path or alias.`,
          { cause },
        )
      }
    }

    const logger = useLogger('nuxt-photo')
    const resolver = createResolver(import.meta.url)
    // Entries of the Vue exports map, resolved from this module: an app installed with a strict
    // package manager cannot import the Vue package by name itself.
    const vueEntry = (entry: string) => resolver.resolvePath(`@lupinum/vue-photo${entry}`)

    // The Vue package imports its label catalogs and its viewer host through named entries of its
    // exports map. Aliases point them at the catalogs of this app's languages and at the host that
    // brings the lightbox CSS of the `css` mode, for client and server alike.
    for (const [entry, filename, catalog] of LABEL_CATALOGS) {
      nuxt.options.alias[`@lupinum/vue-photo/${entry}`] = addTemplate({
        filename,
        write: true,
        getContents: () => {
          const i18nLocales =
            hasNuxtModule('@nuxtjs/i18n') &&
            // @nuxtjs/i18n is optional; keep its config boundary independent of its type augmentation.
            'i18n' in nuxt.options &&
            nuxt.options.i18n &&
            typeof nuxt.options.i18n === 'object' &&
            'locales' in nuxt.options.i18n
              ? nuxt.options.i18n.locales
              : undefined
          return generatePhotoLocales(catalog, options.labels, i18nLocales)
        },
      }).dst
    }
    // The lazy viewer brings the lightbox CSS of the `css` mode, so pages without a photo
    // component load none and a server-rendered deep link inlines it. Registered primitives
    // keep it global instead (see the CSS list below).
    // The host is an app component: Nuxt collects and inlines server styles only for the
    // `<style>` blocks of components it compiles, not for CSS imported by installed packages.
    if (options.css !== 'none') {
      const viewer = await vueEntry('/viewer')
      const styles = await Promise.all(
        (options.css === 'all'
          ? ['lightbox-structure', 'lightbox-theme']
          : ['lightbox-structure']
        ).map((name) => vueEntry(`/styles/${name}.css`)),
      )
      nuxt.options.alias['@lupinum/vue-photo/viewer'] = addTemplate({
        filename: 'nuxt-photo/viewer-host.vue',
        write: true,
        getContents: () =>
          [
            `<script setup>\nimport ViewerHost from ${JSON.stringify(viewer)}\n</script>`,
            // Attributes fall through: the bridge prop reaches the host.
            '<template><ViewerHost /></template>',
            ...styles.map((css) => `<style src=${JSON.stringify(css)}></style>`),
            '',
          ].join('\n'),
      }).dst
    }
    addTemplate({
      filename: 'nuxt-photo-options.mjs',
      getContents: () => {
        const config = JSON.stringify({
          labels: options.labels,
          lightbox: options.lightbox ? { ...options.lightbox, component: undefined } : undefined,
          validation: options.validation,
          provider: options.provider,
        })
        return lightboxComponent
          ? `import LightboxComponent from ${JSON.stringify(lightboxComponent)}\nconst options = ${config}\noptions.lightbox.component = LightboxComponent\nexport default options`
          : `export default ${config}`
      },
    })

    // Folder data stays in Nitro; only localImages opts into a client-wide lookup.
    const publicDir = resolve(nuxt.options.rootDir, nuxt.options.dir.public)
    let manifest = await readLocalImages(publicDir, logger, {
      rootDir: nuxt.options.rootDir,
      clientManifest: options.localImages,
    })
    addServerTemplate({
      filename: '#nuxt-photo-folders',
      getContents: () =>
        `export const manifest = ${JSON.stringify(manifest)}\nexport const baseURL = ${JSON.stringify(nuxt.options.app.baseURL.replace(/\/$/, ''))}`,
    })
    addServerHandler({
      route: '/__nuxt_photo/folder',
      handler: resolver.resolve('./runtime/server/photo-folder'),
    })
    const template = options.localImages
      ? addTemplate({
          filename: 'nuxt-photo-local-images.mjs',
          getContents: () => `export default Object.freeze(${JSON.stringify(manifest)})`,
        })
      : undefined
    if (nuxt.options.dev) {
      // Nitro virtual templates are evaluated on rebuild, not by updateTemplates.
      let reloadFolders: (() => Promise<void>) | undefined
      nuxt.hook('ready', () => {
        const nitro = useNitro()
        reloadFolders = () => nitro.hooks.callHook('rollup:reload')
      })
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
          manifest = await readLocalImages(publicDir, logger, {
            rootDir: nuxt.options.rootDir,
            clientManifest: options.localImages,
          })
          await reloadFolders?.()
          if (template)
            await updateTemplates({
              filter: (candidate) => candidate.filename === template.filename,
            })
        }
      })
    }

    nuxt.hook('modules:done', () => {
      addTemplate({
        filename: 'nuxt-photo-config.mjs',
        getContents:
          () => `${options.localImages ? "import manifest from '#build/nuxt-photo-local-images.mjs'" : ''}
import { createLocalImageDimensionsResolver, withLocalPlaceholders } from ${JSON.stringify(resolver.resolve('./runtime/local-image-dimensions'))}
export const dimensions = ${options.localImages ? 'createLocalImageDimensionsResolver(manifest, ' + JSON.stringify(nuxt.options.app.baseURL) + ')' : 'undefined'}
export const decorateProvider = ${options.localImages ? 'provider => withLocalPlaceholders(provider, dimensions)' : 'provider => provider'}
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

      const recipes = await vueEntry('')
      for (const component of RECIPE_COMPONENTS) {
        addComponent({
          name: `${prefix}${component.name}`,
          export: component.export,
          filePath: recipes,
        })
      }

      if (registerPrimitives(options)) {
        const primitives = await vueEntry('/primitives')
        for (const component of PRIMITIVE_COMPONENTS) {
          addComponent({
            name: `${prefix}${component.name}`,
            export: component.export,
            filePath: primitives,
          })
        }
        // A lower-level component too, but the Vue package exports it from its root entry.
        addComponent({ name: `${prefix}PhotoImage`, export: 'PhotoImage', filePath: recipes })
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

    // The ready-made components' viewer brings the lightbox CSS with its lazy chunk. Registered
    // primitives compose their own lightbox outside that chunk, so the lightbox CSS stays global.
    const lightboxCSS = registerPrimitives(options)
    const structureCSS = [
      ...(lightboxCSS ? ['lightbox-structure'] : []),
      'album',
      'photo-structure',
      'carousel-structure',
    ]
    const themeCSS = [...(lightboxCSS ? ['lightbox-theme'] : []), 'photo', 'carousel-theme']

    const cssFiles =
      options.css === 'all'
        ? [...structureCSS, ...themeCSS]
        : options.css === 'structure'
          ? structureCSS
          : []

    for (const name of cssFiles) {
      const css = await vueEntry(`/styles/${name}.css`)
      if (!nuxt.options.css.includes(css)) {
        nuxt.options.css.push(css)
      }
    }
  },
}) as NuxtModule<NuxtPhotoOptions>
