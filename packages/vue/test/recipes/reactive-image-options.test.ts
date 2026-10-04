// @vitest-environment jsdom

import { createApp, defineComponent, h, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import { provideLightbox } from '../../src/composables/provideLightbox'
import type { PhotoProvider } from '../../src/config'
import PhotoImage from '../../src/primitives/PhotoImage.vue'
import { flushUi, installBrowserStubs } from '../support/runtime'

const photo = makePhoto({ id: 'reactive-options' })

describe('reactive image options', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('updates the effective provided image provider', async () => {
    const firstProvider: PhotoProvider = { url: () => '/first.jpg' }
    const secondProvider: PhotoProvider = { url: () => '/second.jpg' }
    const provider = ref<PhotoProvider>(firstProvider)
    const component = defineComponent({
      setup() {
        provideLightbox([photo], { provider })
        return () => h(PhotoImage, { photo, context: 'slide' })
      },
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp(component)

    app.mount(container)
    await flushUi()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/first.jpg')

    provider.value = secondProvider
    await flushUi()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/second.jpg')

    app.unmount()
    container.remove()
  })

  it('recomputes album sizes when the sizes prop changes', async () => {
    const props = reactive({
      photos: [photo],
      lightbox: false,
      defaultContainerWidth: 600,
      sizes: { size: '100vw' },
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({ render: () => h(PhotoAlbum, props) })

    app.mount(container)
    await flushUi()
    expect(container.querySelector('img')?.getAttribute('sizes')).toContain('100vw')

    props.sizes = { size: '80vw' }
    await flushUi()
    expect(container.querySelector('img')?.getAttribute('sizes')).toContain('80vw')

    app.unmount()
    container.remove()
  })
})
