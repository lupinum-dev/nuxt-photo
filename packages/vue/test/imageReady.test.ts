// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { waitForImageReady } from '../src/lightbox/transitions/image-ready'

describe('transition image readiness', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('removes load listeners after success', async () => {
    const image = document.createElement('img')
    Object.defineProperty(image, 'decode', { configurable: true, value: undefined })
    const remove = vi.spyOn(image, 'removeEventListener')
    const ready = waitForImageReady(image, new AbortController().signal, {
      timeoutMs: 100,
      waitForLoadWithoutDecode: true,
    })

    image.dispatchEvent(new Event('load'))

    await expect(ready).resolves.toEqual({ ok: true })
    expect(remove).toHaveBeenCalledWith('load', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('reports decode failure and rejects a pre-aborted request', async () => {
    const image = document.createElement('img')
    image.decode = vi.fn().mockRejectedValue(new Error('decode failed'))
    await expect(
      waitForImageReady(image, new AbortController().signal, {
        timeoutMs: 100,
        waitForLoadWithoutDecode: true,
      }),
    ).resolves.toMatchObject({ ok: false, error: { message: 'decode failed' } })

    const controller = new AbortController()
    controller.abort()
    await expect(
      waitForImageReady(image, controller.signal, {
        timeoutMs: 100,
        waitForLoadWithoutDecode: true,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  // Catches a ghost that gives up its flight for a fade because `decode()` rejected on an
  // image that is loaded and drawable (seen in WebKit on Linux).
  it('takes a loaded image as ready when its decode is refused', async () => {
    const image = document.createElement('img')
    Object.defineProperty(image, 'complete', { configurable: true, value: true })
    Object.defineProperty(image, 'naturalWidth', { configurable: true, value: 1600 })
    image.decode = vi.fn().mockRejectedValue(new Error('Decoding error.'))

    await expect(
      waitForImageReady(image, new AbortController().signal, {
        timeoutMs: 100,
        waitForLoadWithoutDecode: false,
        decodeLoaded: true,
      }),
    ).resolves.toEqual({ ok: true })
  })

  it('keeps the close path compatible with images without decode support', async () => {
    const image = document.createElement('img')
    Object.defineProperty(image, 'decode', { configurable: true, value: undefined })

    await expect(
      waitForImageReady(image, new AbortController().signal, {
        timeoutMs: 100,
        waitForLoadWithoutDecode: false,
      }),
    ).resolves.toEqual({ ok: true })
  })
})
