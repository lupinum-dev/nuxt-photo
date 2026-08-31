import { defineGinkoDocsConfig } from '@lupinum/ginko-docs/content'

export default defineGinkoDocsConfig({
  site: {
    name: 'Nuxt Photo',
    description:
      'Photo galleries, lightboxes, and carousels for Nuxt with predictable SSR layouts and real image data.',
    whenToUse: 'Use this site to build photo galleries, lightboxes, and carousels with Nuxt Photo.',
  },
  locales: ['en'],
  blog: false,
})
