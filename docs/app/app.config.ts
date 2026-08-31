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
    banner: {
      enabled: true,
      id: 'nuxt-photo-1-beta',
      text: { en: 'These docs describe Nuxt Photo 1.0 beta.' },
      link: {
        label: { en: 'Upgrade from 0.2' },
        to: { en: '/docs/help/upgrade-from-0-2-to-1-0' },
      },
      showOnLanding: true,
    },
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
      eyebrow: { en: 'Nuxt Photo 1.0 beta' },
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
      hero: {
        media: {
          type: 'image',
          src: '/landing-gallery.webp',
          alt: 'A responsive Nuxt Photo album with two rows of landscape and portrait photos',
        },
      },
      features: [
        {
          title: { en: 'Useful before hydration' },
          description: {
            en: 'Known dimensions produce useful layout before images finish loading.',
          },
          icon: 'lucide:layout-grid',
        },
        {
          title: { en: 'Accessible lightbox included' },
          description: {
            en: 'Albums, groups, carousels, and custom triggers share keyboard, gesture, and focus behavior.',
          },
          icon: 'lucide:scan',
        },
        {
          title: { en: 'Customize only what you need' },
          description: {
            en: 'Start with ready-made components. Use slots and lower-level components when the design requires them.',
          },
          icon: 'lucide:layers-3',
        },
      ],
    },
  },
}
