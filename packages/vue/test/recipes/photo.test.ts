// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../../src/components/Photo.vue'
import type { ImageContext, PhotoItem } from '../../src/core/types'
import { flushUi, installBrowserStubs, mountComponent } from '../support/runtime'

describe('Photo', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders thumb semantics and is inert by default', async () => {
    const mounted = await mountComponent(Photo, {
      props: { photo: makePhoto({ id: 'plain' }) },
    })
    const figure = mounted.container.querySelector('figure')
    const image = mounted.container.querySelector('img')
    expect(figure?.getAttribute('role')).toBeNull()
    expect(image?.getAttribute('loading')).toBe('lazy')
    mounted.unmount()
  })

  it('keeps setup-time lightbox capability stable and warns on changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const photo = makePhoto({ id: 'static-photo' })
    const { createApp, defineComponent, h, ref } = await import('vue')
    const lightbox = ref(false)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent(() => () => h(Photo, { photo, lightbox: lightbox.value })),
    )
    app.mount(host)
    lightbox.value = true
    await flushUi()
    expect(host.querySelector('figure')?.getAttribute('role')).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('setup-time'))
    app.unmount()
  })

  it('rejects malformed standalone photo data before rendering', async () => {
    await expect(
      mountComponent(Photo, {
        props: {
          photo: { id: 1, src: '/bad.jpg', width: 10, height: 10 },
        },
      }),
    ).rejects.toThrow(/non-empty string id/)
  })

  it('routes built-in activation failures through Vue error handling', async () => {
    const { createApp, defineComponent, h } = await import('vue')
    const errorHandler = vi.fn()
    const photo = makePhoto({ id: 'failing-open' })
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent(
        () => () =>
          h(Photo, {
            photo,
            lightbox: true,
            transition: 'none',
            imageAdapter: (_photo: PhotoItem, context: ImageContext) => {
              if (context === 'slide') throw new Error('slide adapter failed')
              return { src: photo.src }
            },
          }),
      ),
    )
    app.config.errorHandler = errorHandler
    app.mount(host)

    host.querySelector('figure')?.dispatchEvent(new MouseEvent('click'))
    await flushUi()

    expect(errorHandler).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'slide adapter failed' }),
      expect.anything(),
      expect.stringContaining('render function'),
    )
    app.unmount()
    host.remove()
  })
})
