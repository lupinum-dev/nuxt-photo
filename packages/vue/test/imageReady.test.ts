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
