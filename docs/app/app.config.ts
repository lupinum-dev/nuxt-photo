export default defineAppConfig({
  ui: {
    colors: {
      primary: 'rose',
      neutral: 'neutral'
    },
    footer: {
      slots: {
        root: 'border-t border-default',
        left: 'text-sm text-muted'
      }
    }
  },
  seo: {
    siteName: 'nuxt-photo'
  },
  header: {
    title: 'nuxt-photo',
    to: '/',
    logo: {
      alt: '',
      light: '',
      dark: ''
    },
    search: true,
    colorMode: true,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/mat4m0/nuxt-photo',
      'target': '_blank',
      'aria-label': 'GitHub'
    }]
  },
  footer: {
    credits: `nuxt-photo • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/mat4m0/nuxt-photo',
      'target': '_blank',
      'aria-label': 'nuxt-photo on GitHub'
    }]
  },
  toc: {
    title: 'Table of Contents',
    bottom: {
      title: 'Community',
      edit: 'https://github.com/mat4m0/nuxt-photo/edit/main/content',
      links: [{
        icon: 'i-lucide-star',
        label: 'Star on GitHub',
        to: 'https://github.com/mat4m0/nuxt-photo',
        target: '_blank'
      }, {
        icon: 'i-lucide-book-open',
        label: 'Nuxt UI docs',
        to: 'https://ui.nuxt.com/docs/getting-started/installation/nuxt',
        target: '_blank'
      }]
    }
  }
})
