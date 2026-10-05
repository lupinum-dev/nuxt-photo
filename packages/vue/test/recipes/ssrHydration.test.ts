// @vitest-environment jsdom
import type { CarouselControl } from '../../src'

import { createSSRApp, h, nextTick, ref } from 'vue'
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

let resizeCallback: ResizeObserverCallback
class ResizeObserverMock {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback
  }
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

function pixels(css: string, width: number): number {
  const expression = css.replace(/calc/g, '').replace(/100%/g, String(width)).replace(/px/g, '')
  const tokens = expression.match(/\d*\.\d+|\d+|[()+*/-]/g)!
  expect(tokens.join(''), css).toBe(expression.replace(/\s/g, ''))
  let position = 0
  function factor(): number {
    const token = tokens[position++]
    if (token === '-') return -factor()
    if (token !== '(') return Number(token)
    const value = sum()
    expect(tokens[position++]).toBe(')')
    return value
  }
  function product(): number {
    let value = factor()
    while (tokens[position] === '*' || tokens[position] === '/') {
      const operator = tokens[position++]
      const right = factor()
      value = operator === '*' ? value * right : value / right
    }
    return value
  }
  function sum(): number {
    let value = product()
    while (tokens[position] === '+' || tokens[position] === '-') {
      const operator = tokens[position++]
      const right = product()
      value = operator === '+' ? value + right : value - right
    }
    return value
  }
  const value = sum()
  expect(position).toBe(tokens.length)
  return value
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
  // Catches repartitioning/remounting at the first measurement, even with an SSR estimate.
  it('keeps SSR columns geometry and image nodes at 1200px and 800px containers', async () => {
    const ratios = [0.4, 2, 1, 0.7, 1.8, 0.3, 2.5, 1.2, 0.6, 1.4, 0.8, 3]
    const collection = Array.from({ length: 37 }, (_, index) =>
      makePhoto({
        id: `geometry-${index}`,
        alt: `geometry-${index}`,
        width: ratios[(index * 17) % ratios.length]! * 1000,
        height: 1000,
      }),
    )
    // JSDOM does not lay out boxes. Evaluate the rendered CSS lengths against the actual
    // containing width instead of comparing strings; browser tests also measure real boxes.
    function widths(host: HTMLElement, width: number) {
      return [...host.querySelectorAll<HTMLElement>('.np-album__column')].flatMap((column) => {
        const columnWidth = pixels(column.style.width, width)
        return [...column.querySelectorAll<HTMLElement>('.np-album__item')].map((item) => ({
          id: item.querySelector('img')!.getAttribute('alt'),
          width: pixels(item.style.width, columnWidth),
        }))
      })
    }
    for (const width of [1200, 800]) {
      vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 600,
        width,
        height: 600,
        toJSON: () => ({}),
      })
      const props = {
        photos: collection,
        layout: { type: 'columns' as const, columns: 3 },
        defaultContainerWidth: 1200,
        spacing: 24,
        padding: 4,
        lightbox: false,
      }
      const html = await renderToString(createSSRApp({ render: () => h(PhotoAlbum, props) }))
      const host = document.createElement('div')
      host.innerHTML = html
      document.body.appendChild(host)
      const before = widths(host, width)
      const images = [...host.querySelectorAll('img')]
      const app = createSSRApp({ render: () => h(PhotoAlbum, props) })
      app.mount(host)
      await nextTick()
      try {
        expect(widths(host, width)).toEqual(before)
        expect(
          [...host.querySelectorAll('img')].every((image, index) => image === images[index]),
        ).toBe(true)
      } finally {
        app.unmount()
        host.remove()
      }
    }
  })

  // Catches the SSR flex fallback and first-measurement DP reflow, plus append repartitioning.
  it('keeps evaluated SSR row geometry at 1200px and 800px, including after append', async () => {
    const collection = Array.from({ length: 37 }, (_, index) =>
      makePhoto({
        id: `row-${index}`,
        width: [400, 2000, 1000, 700, 1800][index % 5]!,
        height: 1000,
      }),
    )
    for (const width of [1200, 800]) {
      vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 600,
        width,
        height: 600,
        toJSON: () => ({}),
      })
      const items = ref(collection)
      const render = () =>
        h(PhotoAlbum, {
          photos: items.value,
          layout: 'rows',
          defaultContainerWidth: 1200,
          spacing: 24,
          padding: 4,
          lightbox: false,
        })
      const host = document.createElement('div')
      host.innerHTML = await renderToString(createSSRApp({ render }))
      document.body.appendChild(host)
      const geometry = (actualWidth = width) =>
        [...host.querySelectorAll<HTMLElement>('.np-album__item')].map((item) => ({
          width: pixels(item.style.width, actualWidth),
          ratio:
            item.querySelector('img')!.getAttribute('width')! +
            '/' +
            item.querySelector('img')!.getAttribute('height')!,
        }))
      const before = geometry()
      expect(before.every((item) => Number.isFinite(item.width) && item.width > 0)).toBe(true)
      const images = [...host.querySelectorAll('img')]
      const app = createSSRApp({ render })
      app.mount(host)
      await nextTick()
      try {
        expect(geometry()).toEqual(before)
        expect(
          [...host.querySelectorAll('img')].every((image, index) => image === images[index]),
        ).toBe(true)
        items.value = [
          ...collection,
          ...collection.map((photo) => ({ ...photo, id: `${photo.id}-append` })),
        ]
        await nextTick()
        expect(geometry().slice(0, before.length)).toEqual(before)
        const scaledBeforeResize = geometry(950)
        const rect = new DOMRectReadOnly(0, 0, 950, 600)
        resizeCallback(
          [
            {
              target: host.firstElementChild!,
              contentRect: rect,
              borderBoxSize: [],
              contentBoxSize: [],
              devicePixelContentBoxSize: [],
            },
          ],
          {} as ResizeObserver,
        )
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
        await nextTick()
        expect(geometry(950)).not.toEqual(scaledBeforeResize)
      } finally {
        app.unmount()
        host.remove()
      }
    }
  })

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
      controls: ['arrows', 'thumbnails', 'counter', 'dots'] satisfies CarouselControl[],
      lightbox: { transition: 'none' as const },
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

describe('CSS-only album hydration', () => {
  it.each(['grid', 'mosaic', 'accordion'] as const)(
    'hydrates %s without warnings',
    async (type) => {
      const warn = vi.spyOn(console, 'warn')
      const error = vi.spyOn(console, 'error')
      const { host, app } = await hydrateAlbum({
        photos: Array.from({ length: 8 }, (_, index) => makePhoto({ id: `css-${index}` })),
        layout: { type, max: 5, columns: responsive({ 0: 2, 640: 3 }) },
        spacing: responsive({ 0: 4, 800: 8 }),
        lightbox: false,
      })
      expect(host.querySelectorAll('.np-album__item')).toHaveLength(type === 'mosaic' ? 5 : 8)
      expectNoHydrationWarnings(warn, error)
      app.unmount()
    },
  )
})

it.each([4, responsive({ 0: 2, 768: 4 })])(
  'hydrates bento columns %j without warnings',
  async (columns) => {
    const warn = vi.spyOn(console, 'warn')
    const error = vi.spyOn(console, 'error')
    const { host, app } = await hydrateAlbum({
      photos: Array.from({ length: 12 }, (_, index) => makePhoto({ id: `bento-${index}` })),
      layout: { type: 'bento', columns },
      lightbox: false,
    })
    expect(host.querySelectorAll('.np-album__item')).toHaveLength(12)
    expect(warn).not.toHaveBeenCalled()
    expect(error).not.toHaveBeenCalled()
    app.unmount()
  },
)
