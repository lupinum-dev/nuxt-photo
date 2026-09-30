// @vitest-environment jsdom

import { createApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { provideLightbox } from '../src/composables/provideLightbox'
import LightboxAmbient from '../src/primitives/LightboxAmbient.vue'
import LightboxRoot from '../src/primitives/LightboxRoot.vue'
import { flushUi, installBrowserStubs } from './support/runtime'

describe('LightboxAmbient', () => {
  const loads = new Map<string, () => void>()
  const requests: { src: string; crossOrigin: string | null; fail: () => void }[] = []

  beforeEach(() => {
    installBrowserStubs()
    // Each thumbnail finishes loading only when the test says so.
    vi.stubGlobal(
      'Image',
      class {
        src = ''
        crossOrigin: string | null = null
        naturalWidth = 3
        naturalHeight = 2
        decode() {
          return new Promise<void>((resolve, reject) => {
            loads.set(this.src, resolve)
            requests.push({ src: this.src, crossOrigin: this.crossOrigin, fail: () => reject() })
          })
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    loads.clear()
    requests.length = 0
    document.body.innerHTML = ''
  })

  it('keeps the old glow until the next photo has loaded, then shows only the new one', async () => {
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    let controller: ReturnType<typeof provideLightbox> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          controller = provideLightbox(photos, { transition: 'none' })
          return () => h(LightboxRoot, null, { default: () => h(LightboxAmbient) })
        },
      }),
    )
    app.mount(host)
    const shown = () =>
      [...document.querySelectorAll<HTMLElement>('[data-np-ambient] canvas')].map(
        (layer) => layer.style.opacity !== '0',
      )

    await controller!.open(0)
    await flushUi()
    loads.get(photos[0]!.src)!()
    await flushUi()
    expect(shown()).toEqual([true])

    await controller!.open(1)
    await flushUi()
    // The new layer waits, hidden, while the old glow stays.
    expect(shown()).toEqual([true, false])

    loads.get(photos[1]!.src)!()
    await flushUi()
    expect(shown()).toEqual([true])
    app.unmount()
  })

  it('requests cross-origin thumbnails with CORS, and still glows when CORS is refused', async () => {
    const remote = 'https://images.example.com/remote.jpg'
    const photo = makePhoto({ id: 'remote', src: remote, thumbSrc: remote })
    let controller: ReturnType<typeof provideLightbox> | null = null
    const host = document.createElement('main')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          controller = provideLightbox([photo], { transition: 'none' })
          return () => h(LightboxRoot, null, { default: () => h(LightboxAmbient) })
        },
      }),
    )
    app.mount(host)

    await controller!.open(0)
    await flushUi()
    // Only a CORS request lets the canvas read the pixels to blur them.
    expect(requests.map((request) => request.crossOrigin)).toEqual(['anonymous'])

    // A server without CORS headers fails that request; a plain request follows.
    requests[0]!.fail()
    await flushUi()
    expect(requests.map((request) => request.crossOrigin)).toEqual(['anonymous', null])

    loads.get(remote)!()
    await flushUi()
    expect(document.querySelectorAll('[data-np-ambient] canvas')).toHaveLength(1)
    app.unmount()
  })
})
