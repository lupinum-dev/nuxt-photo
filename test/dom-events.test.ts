// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import { createDOMEvents } from '../src/runtime/lightbox/composables/createDOMEvents'

describe('useDOMEvents', () => {
  it('attaches an event listener with add()', () => {
    const pool = createDOMEvents()
    const div = document.createElement('div')
    const handler = vi.fn()

    pool.add(div, 'click', handler)
    div.dispatchEvent(new Event('click'))

    expect(handler).toHaveBeenCalledOnce()
  })

  it('detaches a specific listener with remove()', () => {
    const pool = createDOMEvents()
    const div = document.createElement('div')
    const handler = vi.fn()

    pool.add(div, 'click', handler)
    pool.remove(div, 'click', handler)
    div.dispatchEvent(new Event('click'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('detaches all listeners with removeAll()', () => {
    const pool = createDOMEvents()
    const div = document.createElement('div')
    const a = vi.fn()
    const b = vi.fn()

    pool.add(div, 'click', a)
    pool.add(div, 'mousedown', b)
    pool.removeAll()

    div.dispatchEvent(new Event('click'))
    div.dispatchEvent(new Event('mousedown'))

    expect(a).not.toHaveBeenCalled()
    expect(b).not.toHaveBeenCalled()
  })

  it('is a no-op when target is null', () => {
    const pool = createDOMEvents()
    expect(() => {
      pool.add(null, 'click', vi.fn() as EventListener)
      pool.remove(null, 'click', vi.fn() as EventListener)
    }).not.toThrow()
  })

  it('supports passive listeners', () => {
    const pool = createDOMEvents()
    const div = document.createElement('div')
    const spy = vi.spyOn(div, 'addEventListener')
    const handler = vi.fn()

    pool.add(div, 'touchstart', handler, true)

    expect(spy).toHaveBeenCalledWith('touchstart', handler, { passive: true })
  })
})
