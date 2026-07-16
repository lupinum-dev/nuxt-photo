import { defineGinkoDocsConfig } from '@lupinum/ginko-docs/content'

export default defineGinkoDocsConfig({
  site: {
    name: 'Nuxt Photo',
    description:
      'Photo galleries, lightboxes, and carousels for Nuxt with predictable SSR layouts and real image data.',
    url: 'https://nuxt-photo.lupinum.com',
  },
  locales: ['en'],
  defaultLocale: 'en',
  blog: false,
})
