import { cp } from 'node:fs/promises'
import { join } from 'node:path'
import NuxtImage from '@nuxt/image'
import NuxtPhoto from '@lupinum/nuxt-photo'

const ipxOnVercel =
  process.env.NITRO_PRESET === 'vercel' && process.env.NUXT_PHOTO_LAB_PROVIDER !== 'vercel'

export default defineNuxtConfig({
  // Imported modules exercise the order-sensitive case that setup-time detection misses.
  modules: [NuxtPhoto, NuxtImage, 'nuxt-shiki'],

  nuxtPhoto: {
    css: 'all',
  },

  image: {
    // Retain Tailwind screens; cover small thumbnails and 2× laptops on Vercel too.
    screens: {
      '2xs': 128,
      xs: 256,
      '3xl': 1920,
      '4xl': 2560,
      '5xl': 3072,
    },
    quality: 80,
    provider: process.env.NUXT_PHOTO_LAB_PROVIDER === 'vercel' ? 'vercel' : 'ipx',
    ...(ipxOnVercel && { ipx: { fs: { dir: './public' } } }),
  },

  // Vercel serves static files from its CDN, outside the IPX function filesystem.
  nitro: ipxOnVercel
    ? {
        hooks: {
          async compiled(nitro) {
            await cp(
              new URL('./public', import.meta.url),
              join(nitro.options.output.serverDir, 'public'),
              {
                recursive: true,
              },
            )
          },
        },
      }
    : {},

  shiki: {
    defaultTheme: 'vitesse-dark',
    defaultLang: 'vue',
  },

  // Nuxt Image's generated #build import must stay inside the dev SSR transform.
  vite: { ssr: { noExternal: ['@nuxt/image'] } },

  devtools: { enabled: true },
  compatibilityDate: '2025-03-25',
})
