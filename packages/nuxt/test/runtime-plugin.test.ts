import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { installPhotoConfig } from '../../vue/src/config/install'
import { PhotoImage } from '../../vue/src'
import { describe, expect, it, vi } from 'vite-plus/test'
import { createNuxtPhotoProviders, type NuxtImageFunction } from '../src/runtime/provider'

const image: NuxtImageFunction = (src, { width, quality, format }, { provider }) =>
  `${provider}:${src}?w=${width}&q=${quality}${format ? `&f=${format}` : ''}`
const options = {
  provider: 'ipx',
  screens: { sm: 320, md: 640 },
  densities: [2, 1, 2],
  quality: 72,
}

describe('Nuxt photo providers', () => {
  it('uses screens × densities, app quality/format, and only IPX placeholders', () => {
    const { resolve, runtime } = createNuxtPhotoProviders(image, options)
    const ipx = resolve('ipx')
    expect(runtime.widths(ipx)).toEqual([320, 640, 1280])
    expect(ipx.url('/full.jpg', { width: 640 })).toBe('ipx:/full.jpg?w=640&q=72&f=webp')
    expect(ipx.placeholder!('/full.jpg')).toBe('ipx:/full.jpg?w=24&q=30&f=webp')
    const custom = createNuxtPhotoProviders(image, { ...options, format: ['avif'] }).resolve(
      'cloudinary',
    )
    expect(custom.url('/full.jpg', { width: 320 })).toBe('cloudinary:/full.jpg?w=320&q=72&f=avif')
    expect(custom.placeholder).toBeUndefined()
    expect(resolve('ipx')).toBe(ipx)
  })

  it('matches the installed Vercel allowlist without density products or terminal widths', () => {
    const { resolve, runtime } = createNuxtPhotoProviders(image, options)
    const vercel = resolve('vercel')
    expect(runtime.widths(vercel)).toEqual([320, 640])
    expect(runtime.allowSourceWidth(vercel)).toBe(false)
    expect(vercel.placeholder).toBeUndefined()
  })

  it.each([
    [500, [320]],
    [200, []],
  ])(
    'keeps actual Vercel requests on-list and at or below source width %s',
    async (width, requested) => {
      const mock = vi.fn(image)
      const { resolve, runtime } = createNuxtPhotoProviders(mock, options)
      const app = createSSRApp({
        render: () =>
          h(PhotoImage, {
            photo: { id: 'vercel', src: '/photo.jpg', width, height: 200 },
          }),
      })
      installPhotoConfig(app, { provider: resolve('vercel') }, runtime)
      const html = await renderToString(app)
      expect(mock.mock.calls.map(([, modifiers]) => modifiers.width)).toEqual(requested)
      if (width === 500) expect(html).toContain('srcset="vercel:/photo.jpg?w=320&amp;q=72 320w"')
      else expect(html).toContain('src="/photo.jpg"')
      expect(html).not.toContain('640w')
    },
  )

  it.each(['ipx', 'ipxStatic', 'vercel'])('preserves GIF and SVG with %s', (name) => {
    const mock = vi.fn(image)
    const provider = createNuxtPhotoProviders(mock, { ...options, format: ['avif'] }).resolve(name)
    expect(provider.url('/animated.GIF?x=1#foo.jpg', { width: 320 })).toBe(
      `${name}:/animated.GIF?x=1#foo.jpg?w=320&q=72`,
    )
    expect(provider.url('/vector%20art.SVG?x=1', { width: 320 })).toBe('/vector%20art.SVG?x=1')
    expect(provider.placeholder?.('/vector.svg')).toBeUndefined()
    expect(mock).toHaveBeenCalledTimes(1)
    if (provider.placeholder)
      expect(provider.placeholder('/animated.gif')).toBe(`${name}:/animated.gif?w=24&q=30`)
  })

  it.each([
    ['/with%20space.jpg', '/with space.jpg'],
    ['/with%2520space.jpg', '/with%20space.jpg'],
    ['/bad%escape.jpg', '/bad%escape.jpg'],
    ['https://example.com/with%20space.jpg', 'https://example.com/with%20space.jpg'],
    ['//example.com/with%20space.jpg', '//example.com/with%20space.jpg'],
  ])('decodes local paths once: %s', (src, decoded) => {
    const provider = createNuxtPhotoProviders(image, options).resolve('ipx')
    expect(provider.url(src, { width: 320 })).toBe(`ipx:${decoded}?w=320&q=72&f=webp`)
  })
})
