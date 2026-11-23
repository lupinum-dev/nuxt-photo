// @vitest-environment jsdom

import { createApp, defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import { provideLightbox } from '../src/composables/provideLightbox'
import LightboxAmbient from '../src/primitives/LightboxAmbient.vue'
import LightboxRoot from '../src/primitives/LightboxRoot.vue'
import { useLightboxInject } from '../src/lightbox/inject'
import type { InternalLightboxContext } from '../src/provide/keys'
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

  /** The glows drawn now, by photo index: each shows unless its opacity is 0. */
  const shown = () =>
    [...document.querySelectorAll<HTMLElement>('[data-np-ambient] canvas')]
      .filter((layer) => layer.style.opacity !== '0')
      .map((layer) => layer.getAttribute('data-np-glow'))

  /** Mount a lightbox with the ambient and a probe that reads the internal context. */
  function mount(
    photos: ReturnType<typeof makePhoto>[],
    thumbnailFor?: (id: string) => HTMLElement | null,
  ) {
    let controller: ReturnType<typeof provideLightbox> | null = null
    let glow: InternalLightboxContext['glow'] | null = null
    const Probe = defineComponent({
      setup() {
        glow = useLightboxInject('Probe').glow
        return () => null
      },
    })
    const host = document.createElement('main')
    document.body.appendChild(host)
    const app = createApp(
      defineComponent({
        setup() {
          controller = provideLightbox(photos, { transition: 'none' }, { thumbnailFor })
          return () => h(LightboxRoot, null, { default: () => [h(LightboxAmbient), h(Probe)] })
        },
      }),
    )
    app.mount(host)
    return { app, controller: () => controller!, follower: () => glow!.current()! }
  }

  it('keeps the old glow until the next photo has loaded, then shows only the new one', async () => {
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    const { app, controller } = mount(photos)

    await controller().open(0)
    await flushUi()
    loads.get(photos[0]!.src)!()
    await flushUi()
    expect(shown()).toEqual(['0'])

    await controller().open(1)
    await flushUi()
    // The new glow waits, hidden, while the old one stays.
    expect(shown()).toEqual(['0'])

    loads.get(photos[1]!.src)!()
    await flushUi()
    expect(shown()).toEqual(['1'])
    app.unmount()
  })

  it('paints the opened photo from the image the page shows, without a request', async () => {
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    const thumb = document.createElement('img')
    Object.defineProperty(thumb, 'complete', { value: true })
    Object.defineProperty(thumb, 'naturalWidth', { value: 3 })
    Object.defineProperty(thumb, 'naturalHeight', { value: 2 })
    const drawn: unknown[] = []
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: (image: unknown) => drawn.push(image),
      getImageData: (_x: number, _y: number, width: number, height: number) => ({
        width,
        height,
        data: new Uint8ClampedArray(width * height * 4),
      }),
      putImageData: () => {},
      clearRect: () => {},
    } as unknown as CanvasRenderingContext2D)
    const { app, controller } = mount(photos, (id) => (id === 'first' ? thumb : null))

    await controller().open(0)
    await flushUi()
    // Ready before the open needs it: no load of its own to wait for.
    expect(drawn[0]).toBe(thumb)
    expect(requests.map((request) => request.src)).not.toContain(photos[0]!.src)
    expect(shown()).toEqual(['0'])
    app.unmount()
  })

  it('follows a swipe: one write per move, and rests on the photo the settle reaches', async () => {
    const photos = [makePhoto({ id: 'a' }), makePhoto({ id: 'b' }), makePhoto({ id: 'c' })]
    const settles: { keyframes: Keyframe[]; finish: () => void }[] = []
    vi.stubGlobal('getComputedStyle', (element: HTMLElement) => ({
      opacity: element.style.opacity || '1',
    }))
    HTMLCanvasElement.prototype.animate = function (keyframes) {
      let finish = () => {}
      const finished = new Promise<void>((resolve) => (finish = resolve))
      settles.push({ keyframes: keyframes as Keyframe[], finish })
      return {
        finished,
        cancel() {},
        pause() {},
        playState: 'paused',
        currentTime: 0,
        startTime: null,
      } as unknown as Animation
    }
    const { app, controller, follower } = mount(photos)
    await controller().open(0)
    await flushUi()

    const canvas = (index: number) =>
      document.querySelector<HTMLElement>(`[data-np-ambient] canvas[data-np-glow="${index}"]`)!
    follower().show(0, 1, 0.2)
    const writes: MutationRecord[] = []
    const observer = new MutationObserver((records) => writes.push(...records))
    observer.observe(document.querySelector('[data-np-ambient]')!, {
      attributes: true,
      subtree: true,
      attributeFilter: ['style'],
    })
    follower().show(0, 1, 0.3)
    await Promise.resolve()
    expect(writes.map((record) => record.target)).toEqual([canvas(1)])
    expect(canvas(1).style.opacity).toBe('0.3')
    observer.disconnect()

    const animation = follower().settle(0, 1, [0.3, 0.8, 1], 120)
    expect(animation).not.toBeNull()
    expect(settles.at(-1)!.keyframes).toEqual([{ opacity: 0.3 }, { opacity: 0.8 }, { opacity: 1 }])
    settles.at(-1)!.finish()
    await flushUi()
    expect(shown()).toEqual(['1'])
    Reflect.deleteProperty(HTMLCanvasElement.prototype, 'animate')
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

  it('requests with CORS when only a srcset candidate is cross-origin', async () => {
    const photo = makePhoto({
      id: 'cdn-srcset',
      src: '/local.jpg',
      thumbSrc: undefined,
      // Candidates may follow a comma without a space.
      srcset: '/local.jpg 300w,https://cdn.example.com/w_600,h_400/b.jpg 600w',
    })
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
    expect(requests.map((request) => request.crossOrigin)).toEqual(['anonymous'])
    app.unmount()
  })
})
