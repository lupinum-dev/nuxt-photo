import { defineNuxtConfig } from 'nuxt/config'

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
  css: ['~/assets/main.css'],
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
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/'],
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
      'Nuxt Photo is a Nuxt module for photo galleries, albums, lightbox and carousel, with first-class @nuxt/image integration.',
    full: {
      title: 'Nuxt Photo Complete Documentation',
      description:
        'The complete Nuxt Photo documentation, written in Markdown (MDC syntax).',
    },
  },
})
