import { afterEach, beforeEach, vi } from 'vitest'

export function setDocumentClientWidth(width: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: width,
  })
}

export function mockImageDecode() {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
}

beforeEach(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1200,
  })
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: 800,
  })
  setDocumentClientWidth(1200)
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  Object.defineProperty(window, 'ResizeObserver', {
    configurable: true,
    writable: true,
    value: class {
      disconnect = vi.fn()
      observe = vi.fn()
      unobserve = vi.fn()
    },
  })
})

afterEach(() => {
  if (typeof document === 'undefined') {
    return
  }

  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})
