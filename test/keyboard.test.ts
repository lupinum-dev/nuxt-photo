// @vitest-environment jsdom

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useKeyboard } from '../src/runtime/lightbox/composables/useKeyboard'

type MockLightbox = {
  element: HTMLElement | null
  template: HTMLElement | null
  isDestroying: boolean
  options: Record<string, unknown>
  currSlide: {
    currZoomLevel: number
    zoomLevels: { fit: number }
    pan: { x: number, y: number }
    panTo: ReturnType<typeof vi.fn>
  } | null
  close: ReturnType<typeof vi.fn>
  next: ReturnType<typeof vi.fn>
  prev: ReturnType<typeof vi.fn>
  toggleZoom: ReturnType<typeof vi.fn>
  dispatch: (name: string, details?: Record<string, unknown>) => {
    type: string
    defaultPrevented: boolean
    preventDefault: () => void
  } & Record<string, unknown>
  on: (name: string, fn: () => void) => void
  off: ReturnType<typeof vi.fn>
  getNumItems: () => number
}

function createMockLightbox(overrides: Partial<MockLightbox> = {}): MockLightbox {
  const listeners = new Map<string, Array<() => void>>()
  const el = document.createElement('div')
  el.setAttribute('tabindex', '-1')
  document.body.appendChild(el)

  return {
    element: el,
    template: el,
    isDestroying: false,
    options: {
      escKey: true,
      arrowKeys: true,
      trapFocus: false,
      returnFocus: false,
    },
    currSlide: {
      currZoomLevel: 1,
      zoomLevels: { fit: 1 },
      pan: { x: 0, y: 0 },
      panTo: vi.fn(),
    },
    close: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    toggleZoom: vi.fn(),
    dispatch(name: string, details?: Record<string, unknown>) {
      return {
        type: name,
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true
        },
        ...(details ?? {}),
      }
    },
    on(name: string, fn: () => void) {
      if (!listeners.has(name)) listeners.set(name, [])
      listeners.get(name)!.push(fn)
    },
    off: vi.fn(),
    getNumItems: () => 3,
    // expose for triggering
    _listeners: listeners,
    ...overrides,
  } as MockLightbox & { _listeners: Map<string, Array<() => void>> }
}

function triggerListeners(lightbox: MockLightbox & { _listeners: Map<string, Array<() => void>> }, name: string) {
  lightbox._listeners.get(name)?.forEach(fn => fn())
}

function fireKey(key: string, extra: Partial<KeyboardEventInit> = {}) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }))
}

let lightbox: MockLightbox & { _listeners: Map<string, Array<() => void>> }

beforeEach(() => {
  lightbox = createMockLightbox() as MockLightbox & { _listeners: Map<string, Array<() => void>> }
  useKeyboard(lightbox as unknown as Parameters<typeof useKeyboard>[0])
  triggerListeners(lightbox, 'bindEvents')
})

afterEach(() => {
  // Clean up DOM elements added during tests
  while (document.body.firstChild) {
    document.body.removeChild(document.body.firstChild)
  }
})

describe('useKeyboard', () => {
  it('closes on Escape', () => {
    fireKey('Escape')
    expect(lightbox.close).toHaveBeenCalledOnce()
  })

  it('navigates with arrow keys', () => {
    fireKey('ArrowLeft')
    expect(lightbox.prev).toHaveBeenCalledOnce()

    fireKey('ArrowRight')
    expect(lightbox.next).toHaveBeenCalledOnce()
  })

  it('toggles zoom on z key', () => {
    fireKey('z')
    expect(lightbox.toggleZoom).toHaveBeenCalledOnce()
  })

  it('suppresses actions when modifier keys are held', () => {
    fireKey('Escape', { ctrlKey: true })
    expect(lightbox.close).not.toHaveBeenCalled()

    fireKey('Escape', { altKey: true })
    expect(lightbox.close).not.toHaveBeenCalled()

    fireKey('Escape', { shiftKey: true })
    expect(lightbox.close).not.toHaveBeenCalled()

    fireKey('Escape', { metaKey: true })
    expect(lightbox.close).not.toHaveBeenCalled()
  })

  it('does nothing when isDestroying is true', () => {
    lightbox.isDestroying = true
    fireKey('Escape')
    expect(lightbox.close).not.toHaveBeenCalled()
  })

  it('does not navigate when escKey option is false', () => {
    lightbox.options.escKey = false
    fireKey('Escape')
    expect(lightbox.close).not.toHaveBeenCalled()
  })

  it('does not navigate with arrows when arrowKeys option is false', () => {
    lightbox.options.arrowKeys = false
    fireKey('ArrowLeft')
    expect(lightbox.prev).not.toHaveBeenCalled()
  })
})
