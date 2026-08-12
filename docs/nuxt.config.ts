const siteUrl = 'https://nuxt-photo.lupinum.com'

const customComponents = [
  'accessibility-lab',
  'album-layout-lab',
  'carousel-lab',
  'collection-ownership-lab',
  'customization-lab',
  'decision-guide',
  'gesture-lab',
  'image-pipeline-lab',
  'lightbox-behavior-lab',
  'photo-model-lab',
  'responsive-lab',
  'ssr-layout-lab',
  'theme-lab',
] as const

const components = Object.fromEntries(
  customComponents.map((name) => [
    name,
    { kind: 'block', props: {}, slots: ['default'], media: null },
  ]),
)

export default defineNuxtConfig({
  extends: ['@lupinum/ginko-docs'],
  modules: ['@nuxt-photo/nuxt'],
  site: { url: siteUrl },
  components: [{ path: '~/components/content', pathPrefix: false, global: true }],
  css: ['~/assets/main.css'],
  nuxtPhoto: { css: 'all' },
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
      },
    },
    markdown: {
      tags: Object.fromEntries(
        [...customComponents, 'pm-install'].map((name) => [
          name,
          name
            .split('-')
            .map((part) => part[0]!.toUpperCase() + part.slice(1))
            .join(''),
        ]),
      ),
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
