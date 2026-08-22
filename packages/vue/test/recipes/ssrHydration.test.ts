// @vitest-environment jsdom

import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { responsive, type PhotoItem } from '../../src/core/index'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'

const photos = [
  makePhoto({ id: 'hydrate-1', width: 1600, height: 900 }),
  makePhoto({ id: 'hydrate-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'hydrate-3', width: 1500, height: 1000 }),
]

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

function stringifyConsoleArgs(calls: unknown[][]) {
  return calls
    .flatMap((args) => args)
    .map((arg) => {
      if (typeof arg === 'symbol') return arg.toString()
      if (typeof arg === 'string') return arg
      if (arg instanceof Error) return arg.message
      try {
        return JSON.stringify(arg)
      } catch {
        return String(arg)
      }
    })
    .join('\n')
}

function expectNoHydrationWarnings(
  warn: ReturnType<typeof vi.spyOn>,
  error: ReturnType<typeof vi.spyOn>,
) {
  const messages = stringifyConsoleArgs([...warn.mock.calls, ...error.mock.calls])
  expect(messages).not.toMatch(/hydration|hydrated.*mismatch|node mismatch/i)
}

async function hydrateAlbum(props: Record<string, unknown>) {
  const albumProps = props as unknown as {
    photos: readonly PhotoItem<object>[]
    [key: string]: unknown
  }
  const ssrApp = createSSRApp({
    render: () => h(PhotoAlbum, albumProps),
  })
  const html = await renderToString(ssrApp)

  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)

  const app = createSSRApp({
    render: () => h(PhotoAlbum, albumProps),
  })
  app.mount(host)
  await nextTick()

  return { host, app }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
  window.ResizeObserver = ResizeObserverMock
  window.IntersectionObserver =
    IntersectionObserverMock as unknown as typeof window.IntersectionObserver
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 900,
    bottom: 600,
    width: 900,
    height: 600,
    toJSON: () => ({}),
  }))
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SSR hydration', () => {
  it('hydrates deterministic columns SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'columns',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      defaultContainerWidth: 800,
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    expectNoHydrationWarnings(warn, error)

    app.unmount()
  })

  it('hydrates deterministic masonry SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'masonry',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      defaultContainerWidth: 800,
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    expectNoHydrationWarnings(warn, error)

    app.unmount()
  })

  it('accepts object-form responsive layout without hydration warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'rows',
        targetRowHeight: responsive({ 0: 180, 800: 240 }),
      },
      breakpoints: [320, 800],
      lightbox: false,
    })

    const messages = stringifyConsoleArgs([...warn.mock.calls, ...error.mock.calls])
    expect(messages).not.toContain('Extraneous non-props attributes')
    expectNoHydrationWarnings(warn, error)

    app.unmount()
  })

  it('hydrates the carousel before reconciling client snap geometry', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const props = {
      photos,
      slideSize: '50%',
      showDots: true,
      lightbox: true,
      transition: 'none' as const,
    }
    const ssrApp = createSSRApp({ render: () => h(PhotoCarousel, props) })
    const html = await renderToString(ssrApp)
    const host = document.createElement('div')
    host.innerHTML = html
    document.body.appendChild(host)
    const app = createSSRApp({ render: () => h(PhotoCarousel, props) })
    app.mount(host)
    await nextTick()

    expect(host.querySelectorAll('.np-carousel__slide')).toHaveLength(photos.length)
    expectNoHydrationWarnings(warn, error)
    app.unmount()
  })
})
