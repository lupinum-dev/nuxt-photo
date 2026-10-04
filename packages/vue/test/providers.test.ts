// @vitest-environment jsdom
import { expect, it, vi } from 'vite-plus/test'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPhoto, definePhotoProvider, PhotoImage, type PhotoProvider } from '../src'
import { makePhoto } from '@test-fixtures/photos'

async function image(
  provider?: PhotoProvider,
  context: 'thumb' | 'slide' = 'thumb',
  overrides = {},
) {
  const app = createSSRApp({
    render: () =>
      h(PhotoImage, {
        photo: makePhoto({ width: 600, height: 400, ...overrides }),
        context,
        sizes: '300px',
      }),
  })
  app.use(createPhoto({ provider }))
  return renderToString(app)
}

it('caps core candidates and adds the intrinsic terminal width without passing sizes to the provider', async () => {
  const url = vi.fn((src: string, opts: { width: number }) => `${src}?w=${opts.width}`)
  const provider = definePhotoProvider({ url })
  expect(definePhotoProvider(provider)).toBe(provider)
  const html = await image(provider)
  expect(url.mock.calls.map(([, opts]) => opts)).toEqual([
    { width: 256 },
    { width: 384 },
    { width: 512 },
    { width: 600 },
  ])
  expect(html).toContain('600w')
  expect(html).not.toContain('640w')
  expect(html).toContain('sizes="auto, 300px"')
})

it('merges equal URLs even when they are not adjacent, retaining the largest width descriptor', async () => {
  const html = await image({
    url: (_src, opts) => (opts.width === 256 || opts.width === 512 ? '/a.jpg' : '/b.jpg'),
  })
  expect(html).toContain('srcset="/a.jpg 512w, /b.jpg 600w"')
})

it('uses fixed srcsets and explicit placeholders instead of generating candidates or previews', async () => {
  const placeholder = vi.fn(() => '/provider-preview.jpg')
  const html = await image(
    { url: (src) => src, srcset: () => '/fixed.jpg 600w', placeholder },
    'thumb',
    { placeholderSrc: '/explicit.jpg' },
  )
  expect(html).toContain('srcset="/fixed.jpg 600w"')
  expect(html).toContain('explicit.jpg')
  expect(placeholder).not.toHaveBeenCalled()
})

it('keeps native sources and fixed renditions, including a separate thumbnail crop', async () => {
  const html = await image(undefined, 'slide', {
    src: '/original.jpg',
    srcset: '/fixed.jpg 600w',
    thumbSrc: '/crop.jpg',
  })
  expect(html).toContain('src="/original.jpg"')
  expect(html).toContain('srcset="/fixed.jpg 600w"')
  const crop = await image(undefined, 'thumb', {
    src: '/original.jpg',
    thumbSrc: '/crop.jpg',
    srcset: '/fixed.jpg 600w',
  })
  expect(crop).toContain('src="/crop.jpg"')
  expect(crop).not.toContain('srcset=')
})

it('passes SVGs untouched without requesting a URL, srcset, or preview from any provider', async () => {
  const url = vi.fn(() => '/wrong.svg')
  const placeholder = vi.fn(() => '/wrong.jpg')
  const html = await image({ url, placeholder }, 'slide', {
    src: '/icon.SVG?v=1',
    srcset: '/wrong.svg 600w',
  })
  expect(html).toContain('src="/icon.SVG?v=1"')
  expect(html).not.toContain('srcset=')
  expect(url).not.toHaveBeenCalled()
  expect(placeholder).not.toHaveBeenCalled()
})
