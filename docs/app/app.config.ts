export default {
  ginkoDocs: {
    theme: {
      preset: 'nuxt',
      codeBlocks: 'adaptive',
    },
    site: {
      url: 'https://nuxt-photo.lupinum.com',
      name: { en: 'Nuxt Photo' },
      description: {
        en: 'Photo galleries, lightboxes, and carousels for Nuxt.',
      },
      logo: { light: '/logo-light.svg', dark: '/logo-dark.svg' },
      docsSidebarSwitcher: 'tabs',
      legalLinks: [
        { label: { en: 'Legal notice' }, to: 'https://lupinum.com/impressum' },
        { label: { en: 'Privacy' }, to: 'https://lupinum.com/datenschutz' },
      ],
    },
    nav: { links: 'auto', socialIcons: true },
    social: {
      github: 'https://github.com/lupinum-dev/nuxt-photo',
      discord: 'https://discord.gg/RPH6SeA36N',
    },
    feedback: { enabled: true },
    analytics: { plausible: { scriptId: 'AdOTbq5X_7FOIbPeaHoma' } },
    repository: {
      url: 'https://github.com/lupinum-dev/nuxt-photo',
      branch: 'main',
      contentDirectory: 'docs/content',
    },
    landing: {
      title: { en: 'Albums and lightboxes for Nuxt.' },
      description: {
        en: 'Render responsive photo layouts on the server, then open the included accessible lightbox. Add Nuxt Image when you need image optimization.',
      },
      primary: {
        label: { en: 'Install the beta' },
        to: { en: '/docs/start/installation' },
      },
      secondary: {
        label: { en: 'View on GitHub' },
        to: { en: 'https://github.com/lupinum-dev/nuxt-photo' },
      },
      install: {
        command: 'pnpm add @lupinum/nuxt-photo@next',
      },
      features: [],
    },
  },
}
