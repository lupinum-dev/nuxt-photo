import { readdirSync, readFileSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exampleSources } from './example-sources'

const siteUrl = 'https://nuxt-photo.lupinum.com'
const ginkoDocsDir = realpathSync(
  fileURLToPath(new URL('./node_modules/@lupinum/ginko-docs', import.meta.url)),
)

const customComponents = [
  'album-layout-lab',
  'carousel-lab',
  'customization-lab',
  'decision-guide',
] as const

const components = Object.fromEntries(
  customComponents.map((name) => [
    name,
    { kind: 'block', props: {}, slots: ['default'], media: null },
  ]),
)

export default defineNuxtConfig({
  extends: ['@lupinum/ginko-docs'],
  modules: ['@lupinum/nuxt-photo'],
  // Ginko removes these routes when the blog collection is disabled. Keep
  // vue-tsc aligned with the application Nuxt actually generates.
  typescript: {
    tsConfig: {
      exclude: [join(ginkoDocsDir, 'app/pages/blog/**/*')],
    },
  },
  site: { url: siteUrl },
  components: [{ path: '~/components/content', pathPrefix: false, global: true }],
  css: ['~/assets/main.css'],
  ginkoDocs: {
    syntaxHighlighting: {
      themes: {
        light: 'material-theme-lighter',
        dark: 'material-theme-palenight',
      },
    },
  },
  nuxtPhoto: { css: 'all' },
  vite: { plugins: [exampleSources()] },
  nitro: {
    // The agent Markdown serializer writes each example's source into the page.
    virtual: {
      '#docs/example-sources': () => {
        const directory = fileURLToPath(new URL('./app/examples', import.meta.url))
        const sources = Object.fromEntries(
          readdirSync(directory)
            .filter((file) => file.endsWith('.vue'))
            .map((file) => [file, readFileSync(join(directory, file), 'utf8').trimEnd()]),
        )
        return `export default ${JSON.stringify(sources)}`
      },
    },
  },
  content: {
    componentPolicy: {
      components: {
        ...components,
        'pm-install': {
          kind: 'block',
          props: { name: { type: 'string', required: true } },
          slots: ['default'],
          media: null,
        },
        example: {
          kind: 'block',
          props: {
            name: { type: 'string', required: true },
            also: { type: 'string', required: false },
            code: { type: 'string', required: false },
          },
          slots: [],
          media: null,
        },
      },
    },
    markdown: {
      tags: {
        ...Object.fromEntries(
          [...customComponents, 'pm-install'].map((name) => [
            name,
            name
              .split('-')
              .map((part) => part[0]!.toUpperCase() + part.slice(1))
              .join(''),
          ]),
        ),
        example: 'ExampleBlock',
      },
    },
  },
  app: {
    head: {
      title: 'Nuxt Photo',
      meta: [
        {
          name: 'description',
          content:
            'Photo galleries, lightboxes, and carousels for Nuxt with predictable SSR layouts and real image data.',
        },
      ],
    },
  },
  compatibilityDate: '2025-07-15',
})
