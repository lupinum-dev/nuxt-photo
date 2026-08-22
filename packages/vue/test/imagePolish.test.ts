// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { createApp, defineComponent, h, reactive, ref } from 'vue'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoImage from '../src/primitives/PhotoImage.vue'
import type { ImageAdapter } from '../src/core/types'
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

  it.each(['rows', 'columns'] as const)(
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
        ['(max-width: 600px) 100vw, 50vw', '(max-width: 600px) 100vw, 50vw'],
      )
      mounted.unmount()
    },
  )
})
