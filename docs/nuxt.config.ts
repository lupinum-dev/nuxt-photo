import { defineNuxtConfig } from 'nuxt/config'

const docsBuildSourcemapPlugins = [
  '@tailwindcss/vite:generate:build',
  'nuxt:module-preload-polyfill',
  'nuxt:vue-async-context',
]

function isDocsBuildSourcemapWarning(message: string, plugin?: string) {
  if (!message.includes('Sourcemap is likely to be incorrect')) {
    return false
  }

  if (plugin) {
    return docsBuildSourcemapPlugins.includes(plugin)
  }

  return docsBuildSourcemapPlugins.some((name) =>
    message.includes(`plugin (${name})`),
  )
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt-photo/nuxt',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'nuxt-llms',
  ],

  nuxtPhoto: {
    css: 'all',
  },

  devtools: {
    enabled: true,
  },
  sourcemap: {
    client: false,
    server: false,
  },
  css: ['~/assets/main.css'],
  icon: {
    fetchTimeout: 10_000,
    serverBundle: {
      collections: ['lucide', 'simple-icons', 'vscode-icons'],
    },
    clientBundle: {
      scan: true,
      icons: [
        'vscode-icons:file-type-typescript',
        'vscode-icons:file-type-vue',
        'vscode-icons:file-type-css',
        'vscode-icons:file-type-html',
        'vscode-icons:file-type-markdown',
        'vscode-icons:file-type-yaml',
        'vscode-icons:file-type-sql',
        'vscode-icons:file-type-shell',
      ],
    },
  },
  content: {
    build: {
      markdown: {
        highlight: {
          langs: [
            'bash',
            'diff',
            'json',
            'js',
            'ts',
            'html',
            'css',
            'vue',
            'shell',
            'mdc',
            'md',
            'yaml',
            'sql',
            'jsonc',
          ],
        },
        remarkPlugins: {
          'remark-mdc': {
            options: {
              autoUnwrap: true,
            },
          },
        },
      },
    },
    experimental: { sqliteConnector: 'native' },
  },
  ui: {
    theme: {
      colors: [
        'primary',
        'secondary',
        'info',
        'success',
        'warning',
        'error',
        'important',
      ],
    },
  },
  routeRules: {
    '/': { prerender: true },
  },
  experimental: {
    asyncContext: true,
  },
  compatibilityDate: '2025-02-11',
  hooks: {
    'vite:extendConfig'(config) {
      if (config.customLogger) {
        const warn = config.customLogger.warn.bind(config.customLogger)
        const warnOnce = config.customLogger.warnOnce.bind(config.customLogger)

        config.customLogger.warn = (message, options) => {
          if (isDocsBuildSourcemapWarning(message)) {
            return
          }

          warn(message, options)
        }
        config.customLogger.warnOnce = (message, options) => {
          if (isDocsBuildSourcemapWarning(message)) {
            return
          }

          warnOnce(message, options)
        }
      }

      config.build ??= {}
      config.build.rollupOptions ??= {}

      const onwarn = config.build.rollupOptions.onwarn
      config.build.rollupOptions.onwarn = (warning, warn) => {
        if (isDocsBuildSourcemapWarning(warning.message, warning.plugin)) {
          return
        }

        if (
          warning.code === 'INVALID_ANNOTATION' &&
          warning.message.includes('@vueuse/core') &&
          warning.message.includes('#__PURE__')
        ) {
          return
        }

        if (onwarn) {
          onwarn(warning, warn)
          return
        }

        warn(warning)
      }
    },
  },
  vite: {
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
    },
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/_og/'],
      autoSubfolderIndex: false,
    },
  },
  typescript: {
    strict: false,
  },
  llms: {
    domain: 'https://nuxt-photo.lupinum.com',
    title: 'Nuxt Photo Documentation for LLMs',
    description:
      'Nuxt Photo is a Nuxt module for photo galleries, albums, lightbox and carousel, with a built-in @nuxt/image adapter.',
    full: {
      title: 'Nuxt Photo Complete Documentation',
      description:
        'The complete Nuxt Photo documentation, written in Markdown (MDC syntax).',
    },
  },
})
