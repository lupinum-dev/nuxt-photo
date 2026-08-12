export default {
  ginkoDocs: {
    site: {
      url: 'https://nuxt-photo.lupinum.com',
      name: { en: 'Nuxt Photo' },
      description: {
        en: 'Responsive photo galleries, lightboxes, and carousels for Nuxt.',
      },
      logo: { light: '/icon.png', dark: '/icon.png' },
      localeSwitcher: 'dropdown',
      docsSidebarSwitcher: 'tabs',
    },
    social: {
      github: 'https://github.com/lupinum-dev/nuxt-photo',
      discord: 'https://discord.gg/RPH6SeA36N',
    },
    repository: {
      url: 'https://github.com/lupinum-dev/nuxt-photo',
      branch: 'main',
      contentDirectory: 'docs/content',
    },
    landing: {
      eyebrow: { en: 'One photo model. Every surface.' },
      title: { en: 'Photo galleries for Nuxt.' },
      description: {
        en: 'Render responsive albums, shared lightboxes, and carousels with stable server geometry, accessible interaction, and optional Nuxt Image delivery.',
      },
      primary: {
        label: { en: 'Start building' },
        to: { en: '/docs/getting-started' },
      },
      secondary: {
        label: { en: 'View on GitHub' },
        to: { en: 'https://github.com/lupinum-dev/nuxt-photo' },
      },
      features: [
        {
          title: { en: 'Layout before load' },
          description: {
            en: 'Intrinsic dimensions produce useful server-rendered geometry before images download.',
          },
          icon: 'lucide:layout-grid',
        },
        {
          title: { en: 'One collection, one viewer' },
          description: {
            en: 'Albums, groups, carousels, and custom triggers share navigation, focus, and gesture behavior.',
          },
          icon: 'lucide:scan',
        },
        {
          title: { en: 'Recipes when possible' },
          description: {
            en: 'Start with ready components and move to primitives only when the design requires new markup.',
          },
          icon: 'lucide:layers-3',
        },
      ],
    },
  },
}
