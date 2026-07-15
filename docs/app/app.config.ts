export default {
  ginkoDocs: {
    site: {
      url: 'https://nuxt-photo.lupinum.com',
      name: { en: 'Nuxt Photo' },
      description: { en: 'Photo galleries, lightboxes, and carousels for Nuxt.' },
      logo: { light: '/icon.png', dark: '/icon.png' },
      localeSwitcher: 'dropdown',
      docsSidebarSwitcher: 'list'
    },
    social: { github: 'https://github.com/lupinum-dev/nuxt-photo' },
    repository: {
      url: 'https://github.com/lupinum-dev/nuxt-photo',
      branch: 'main',
      contentDirectory: 'docs/content'
    },
    landing: {
      eyebrow: { en: 'Real image data. Predictable layout.' },
      title: { en: 'Photo experiences that feel native to Nuxt.' },
      description: {
        en: 'Build responsive albums, shared lightboxes, and carousels with stable SSR geometry, accessible interaction, and optional Nuxt Image support.'
      },
      primary: {
        label: { en: 'Build your first gallery' },
        to: { en: '/docs/getting-started/first-gallery' }
      },
      secondary: {
        label: { en: 'View on GitHub' },
        to: { en: 'https://github.com/lupinum-dev/nuxt-photo' }
      },
      features: [
        {
          title: { en: 'Stable from SSR' },
          description: { en: 'Known dimensions produce useful layout before images finish loading.' },
          icon: 'lucide:layout-grid'
        },
        {
          title: { en: 'One shared lightbox' },
          description: { en: 'Albums, groups, carousels, and custom triggers share keyboard, gesture, and focus behavior.' },
          icon: 'lucide:scan'
        },
        {
          title: { en: 'Progressively customizable' },
          description: { en: 'Start with ready components and move down to primitives only when your design needs it.' },
          icon: 'lucide:layers-3'
        }
      ]
    }
  }
}
