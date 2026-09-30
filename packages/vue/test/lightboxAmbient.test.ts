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

  beforeEach(() => {
    installBrowserStubs()
    // Each thumbnail finishes loading only when the test says so.
    vi.stubGlobal(
      'Image',
      class {
        src = ''
        naturalWidth = 3
        naturalHeight = 2
        decode() {
          return new Promise<void>((resolve) => loads.set(this.src, resolve))
        }
      },
    )
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    loads.clear()
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
})
