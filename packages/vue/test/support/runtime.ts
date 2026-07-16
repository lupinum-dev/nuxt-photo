import {
  createApp,
  h,
  nextTick,
  provide,
  type Component,
  type InjectionKey,
} from 'vue'
import { vi } from 'vitest'

export function installBrowserStubs() {
  class Observer {
    observe() {}
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return []
    }
  }

  vi.stubGlobal('ResizeObserver', Observer)
  vi.stubGlobal('IntersectionObserver', Observer)
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }))
  vi.stubGlobal(
    'Image',
    class {
      onload: null | (() => void) = null
      onerror: null | (() => void) = null
      complete = true
      decode() {
        return Promise.resolve()
      }
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    window.setTimeout(() => callback(performance.now() + 1000), 0),
  )
  vi.stubGlobal('cancelAnimationFrame', (id: number) => window.clearTimeout(id))
}

export async function flushUi(iterations = 6) {
  for (let index = 0; index < iterations; index++) {
    await Promise.resolve()
    await nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

export async function mountComponent(
  component: Component,
  options: {
    props?: Record<string, unknown>
    slots?: Record<string, (...args: unknown[]) => unknown>
    provideValues?: Array<[InjectionKey<unknown> | string, unknown]>
  } = {},
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const app = createApp({
    setup() {
      for (const [key, value] of options.provideValues ?? []) {
        provide(key as InjectionKey<unknown>, value)
      }
      return () => h(component, options.props ?? {}, options.slots ?? {})
    },
  })
  app.mount(container)
  await flushUi(2)
  return {
    app,
    container,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}
