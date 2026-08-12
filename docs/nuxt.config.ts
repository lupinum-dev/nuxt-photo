const siteUrl = 'https://nuxt-photo.lupinum.com'

const legacyDocRedirects = {
  '/docs/overview': '/docs/getting-started',
  '/docs/overview/why-nuxt-photo': '/docs/getting-started',
  '/docs/overview/how-it-works': '/docs/concepts/how-it-works',
  '/docs/overview/design-decisions': '/docs/concepts/how-it-works',
  '/docs/overview/comparison': '/docs/getting-started',
  '/docs/getting-started/first-gallery': '/docs/getting-started',
  '/docs/concepts': '/docs/concepts/how-it-works',
  '/docs/concepts/customization-layers': '/docs/concepts/how-it-works',
  '/docs/concepts/ssr-and-layout-stability': '/docs/concepts/server-rendering',
  '/docs/guides': '/docs/guides/cms-gallery',
  '/docs/guides/build-a-cms-gallery': '/docs/guides/cms-gallery',
  '/docs/guides/share-a-lightbox': '/docs/concepts/collections-and-ownership',
  '/docs/guides/shared-lightbox': '/docs/concepts/collections-and-ownership',
  '/docs/guides/build-a-carousel': '/docs/guides/carousel',
  '/docs/guides/tune-a-responsive-album': '/docs/guides/responsive-album',
  '/docs/guides/create-a-custom-thumbnail-layout': '/docs/customization/custom-thumbnail-layout',
  '/docs/guides/customize-the-lightbox': '/docs/customization/customize-lightbox',
  '/docs/guides/integrate-a-custom-image-service': '/docs/customization/custom-image-service',
  '/docs/guides/control-a-lightbox-programmatically': '/docs/guides/programmatic-lightbox',
  '/docs/api': '/docs/components/photo',
  '/docs/api/photo': '/docs/components/photo',
  '/docs/api/photo-album': '/docs/components/photo-album',
  '/docs/api/photo-group': '/docs/components/photo-group',
  '/docs/api/photo-carousel': '/docs/components/photo-carousel',
  '/docs/api/lightbox': '/docs/components/lightbox',
  '/docs/api/primitives': '/docs/components/lightbox-primitives',
  '/docs/api/composables': '/docs/reference/composables',
  '/docs/api/configuration': '/docs/reference/configuration',
  '/docs/api/types': '/docs/reference/types',
  '/docs/api/css': '/docs/reference/css',
  '/docs/api/public-api': '/docs/resources/package-exports',
  '/docs/api/bundle-size': '/docs/resources/package-exports',
  '/docs/operations': '/docs/troubleshooting',
  '/docs/operations/troubleshooting': '/docs/troubleshooting',
  '/docs/help': '/docs/troubleshooting',
  '/docs/help/troubleshooting': '/docs/troubleshooting',
  '/docs/help/sharp-edges': '/docs/troubleshooting',
  '/docs/project': '/docs/resources/package-exports',
  '/docs/project/architecture': '/docs/resources/package-exports',
} as const

const customComponents = [
  'album-layout-lab',
  'carousel-lab',
  'image-pipeline-lab',
  'lightbox-behavior-lab',
  'module-config-lab',
  'responsive-lab',
  'ssr-layout-lab',
] as const

const contentComponentTags = Object.fromEntries(
  customComponents.map((tag) => [
    tag,
    `Docs${tag
      .split('-')
      .map((part) => part[0]!.toUpperCase() + part.slice(1))
      .join('')}`,
  ]),
)
const contentComponentNames = new Set(
  Object.values(contentComponentTags).map((name) => name.slice('Docs'.length)),
)

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
  i18n: {
    baseUrl: siteUrl,
    locales: [{ code: 'en', language: 'en-US', name: 'English' }],
  },
  routeRules: Object.fromEntries(
    Object.entries(legacyDocRedirects).map(([path, to]) => [
      path,
      { redirect: { to, statusCode: 301 } },
    ]),
  ),
  css: ['~/assets/main.css'],
  nuxtPhoto: {
    css: 'all',
    // Ginko Docs registers Nuxt Image. Keep imported demo assets on their final
    // Vite URLs instead of routing them through IPX during prerendering.
    image: { provider: 'native' },
  },
  hooks: {
    'components:extend'(registeredComponents) {
      for (const component of registeredComponents) {
        if (contentComponentNames.has(component.pascalName)) {
          component.pascalName = `Docs${component.pascalName}`
          component.kebabName = `docs-${component.kebabName}`
          component.global = true
        }
      }
    },
  },
  content: {
    componentPolicy: {
      components,
    },
    markdown: {
      tags: contentComponentTags,
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
