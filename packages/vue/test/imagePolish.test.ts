// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, reactive, ref } from 'vue'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoImage from '../src/primitives/PhotoImage.vue'
import type { ImageAdapter, PhotoItem } from '../src/core/types'
import { flushUi, installBrowserStubs, mountComponent } from './support/runtime'

describe('image previews and sizes', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('resets the placeholder when adapter output or context changes', async () => {
    const version = ref('a')
    const props = reactive<{
      photo: ReturnType<typeof makePhoto>
      context: 'thumb' | 'slide'
      imageAdapter: ImageAdapter<object>
    }>({
      photo: makePhoto({ id: 'preview', placeholderSrc: '/preview.jpg' }),
      context: 'thumb',
      imageAdapter: (_photo, context) => ({
        src: `/${version.value}-${context}.jpg`,
        placeholderSrc: '/preview.jpg',
      }),
    })
    const App = defineComponent({ setup: () => () => h(PhotoImage, props) })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushUi()
    const image = host.querySelector('img') as HTMLImageElement

    expect(image.style.backgroundImage).toContain('preview.jpg')
    image.dispatchEvent(new Event('load'))
    await flushUi()
    expect(image.style.backgroundImage).toBe('')

    version.value = 'b'
    await flushUi()
    expect(image.src).toContain('/b-thumb.jpg')
    expect(image.style.backgroundImage).toContain('preview.jpg')

    image.dispatchEvent(new Event('load'))
    props.context = 'slide'
    await flushUi()
    expect(image.src).toContain('/b-slide.jpg')
    expect(image.style.backgroundImage).toContain('preview.jpg')

    image.dispatchEvent(new Event('error'))
    await flushUi()
    expect(image.style.backgroundImage).toContain('preview.jpg')

    props.imageAdapter = () => ({ src: '/adapter-c.jpg', placeholderSrc: '/adapter-c-preview.jpg' })
    await flushUi()
    expect(image.src).toContain('/adapter-c.jpg')
    expect(image.style.backgroundImage).toContain('adapter-c-preview.jpg')

    app.unmount()
    host.remove()
  })

  it('tracks the complete responsive request without resetting for unrelated photo data', async () => {
    const version = ref('a')
    const props = reactive({
      photo: makePhoto({ id: 'responsive', alt: 'Initial', placeholderSrc: '/preview.jpg' }),
      sizes: '50vw',
      imageAdapter: () => ({
        src: '/same.jpg',
        srcset: `/same-${version.value}.jpg 800w`,
        placeholderSrc: '/preview.jpg',
      }),
    })
    const App = defineComponent({ setup: () => () => h(PhotoImage, props) })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(App)
    app.mount(host)
    await flushUi()
    const image = host.querySelector('img') as HTMLImageElement

    image.dispatchEvent(new Event('load'))
    await flushUi()
    expect(image.style.backgroundImage).toBe('')

    version.value = 'b'
    await flushUi()
    expect(image.style.backgroundImage).toContain('preview.jpg')

    image.dispatchEvent(new Event('load'))
    props.sizes = '100vw'
    await flushUi()
    expect(image.style.backgroundImage).toContain('preview.jpg')

    image.dispatchEvent(new Event('load'))
    props.photo = { ...props.photo, alt: 'Changed only' }
    await flushUi()
    expect(image.style.backgroundImage).toBe('')

    app.unmount()
    host.remove()
  })

  it('recognizes an already cached image after mount', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(800)
    const mounted = await mountComponent(PhotoImage, {
      props: { photo: makePhoto({ id: 'cached', placeholderSrc: '/preview.jpg' }) },
    })
    await flushUi()

    expect((mounted.container.querySelector('img') as HTMLImageElement).style.backgroundImage).toBe(
      '',
    )
    mounted.unmount()
  })

  it.each(['rows', 'columns', 'masonry'] as const)(
    'passes native sizes strings through %s layouts',
    async (layout) => {
      const mounted = await mountComponent(PhotoAlbum, {
        props: {
          photos: [makePhoto({ id: `${layout}-one` }), makePhoto({ id: `${layout}-two` })],
          layout,
          lightbox: false,
          defaultContainerWidth: 800,
          sizes: '(max-width: 600px) 100vw, 50vw',
        },
      })

      expect(Array.from(mounted.container.querySelectorAll('img'), (image) => image.sizes)).toEqual(
        ['auto, (max-width: 600px) 100vw, 50vw', 'auto, (max-width: 600px) 100vw, 50vw'],
      )
      mounted.unmount()
    },
  )

  // Catches missing auto fallback, duplicate auto prefixes, and lazy hints on priority images.
  it.each([
    {
      sizes: undefined,
      loading: undefined,
      priority: false,
      expected: 'auto, 100vw',
      hint: 'lazy',
    },
    { sizes: '50vw', loading: 'lazy', priority: false, expected: 'auto, 50vw', hint: 'lazy' },
    { sizes: 'auto, 50vw', loading: 'lazy', priority: false, expected: 'auto, 50vw', hint: 'lazy' },
    { sizes: '50vw', loading: 'eager', priority: false, expected: '50vw', hint: 'eager' },
    { sizes: '50vw', loading: undefined, priority: true, expected: '50vw', hint: 'eager' },
    { sizes: '50vw', loading: 'lazy', priority: true, expected: 'auto, 50vw', hint: 'lazy' },
  ] as const)('renders sizes $expected with loading $hint and priority $priority', async (row) => {
    const mounted = await mountComponent(PhotoImage, {
      props: { photo: makePhoto(), sizes: row.sizes, loading: row.loading, priority: row.priority },
    })
    const image = mounted.container.querySelector('img')!
    expect(image.sizes).toBe(row.expected)
    expect(image.getAttribute('loading')).toBe(row.hint)
    expect(image.getAttribute('fetchpriority')).toBe(row.priority ? 'high' : null)
    mounted.unmount()
  })

  // Catches adapter fallback overriding measured widths or object sizes in non-row layouts.
  it.each(['rows', 'columns', 'masonry'] as const)(
    'sizes and prioritizes %s thumbnails by photo index',
    async (type) => {
      for (const sizes of [undefined, '70vw', { size: '100vw' }]) {
        const mounted = await mountComponent(PhotoAlbum, {
          props: {
            photos: Array.from({ length: 4 }, (_, index) =>
              makePhoto({
                id: `budget-${index}`,
                src: `/budget-${index}.jpg`,
                width: 400,
                height: 400,
              }),
            ),
            layout: type === 'rows' ? { type, targetRowHeight: 400 } : { type, columns: 2 },
            defaultContainerWidth: 800,
            spacing: 8,
            padding: 4,
            sizes,
            priority: 2,
            lightbox: false,
            imageAdapter: (photo: PhotoItem) => ({ src: photo.src, sizes: '400px' }),
          },
        })
        const images = Array.from(mounted.container.querySelectorAll('img'))
        expect(images).toHaveLength(4)
        for (const image of images) {
          const index = Number(image.src.match(/budget-(\d)/)?.[1])
          const eager = index < 2
          expect(image.getAttribute('loading')).toBe(eager ? 'eager' : 'lazy')
          expect(image.getAttribute('fetchpriority')).toBe(eager ? 'high' : null)
          const expected =
            typeof sizes === 'string' ? sizes : sizes ? 'calc((100vw - 24px) / 2)' : '388px'
          expect(image.sizes).toBe(`${eager ? '' : 'auto, '}${expected}`)
        }
        mounted.unmount()
      }
    },
  )
})
