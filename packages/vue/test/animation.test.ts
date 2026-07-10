// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { animateNumber } from '../src/lightbox/transitions/animation'

describe('abortable animation', () => {
  it('cancels its frame and schedules no continuation after abort', async () => {
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextId = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextId
      callbacks.set(id, callback)
      return id
    })
    const cancel = vi
      .spyOn(window, 'cancelAnimationFrame')
      .mockImplementation((id) => callbacks.delete(id))
    const controller = new AbortController()
    const update = vi.fn()

    const animation = animateNumber(
      0,
      1,
      300,
      update,
      undefined,
      controller.signal,
    )
    controller.abort()

    await expect(animation).rejects.toMatchObject({ name: 'AbortError' })
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(callbacks.size).toBe(0)
    expect(update).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})
