// @vitest-environment jsdom

import { createApp, defineComponent, h, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import { useLightboxProvider } from '../../src/composables/useLightboxProvider'
import type { ImageAdapter } from '../../src/core/index'
import PhotoImage from '../../src/primitives/PhotoImage.vue'
import { flushUi, installBrowserStubs } from '../support/runtime'

const photo = makePhoto({ id: 'reactive-options' })

describe('reactive image options', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('updates the effective provided image adapter', async () => {
    const firstAdapter: ImageAdapter = () => ({ src: '/first.jpg' })
    const secondAdapter: ImageAdapter = () => ({ src: '/second.jpg' })
    const imageAdapter = ref<ImageAdapter>(firstAdapter)
    const component = defineComponent({
      setup() {
        useLightboxProvider([photo], { imageAdapter })
        return () => h(PhotoImage, { photo, context: 'slide' })
      },
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp(component)

    app.mount(container)
    await flushUi()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/first.jpg')

    imageAdapter.value = secondAdapter
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
