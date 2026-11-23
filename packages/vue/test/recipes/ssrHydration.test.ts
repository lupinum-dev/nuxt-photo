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
  // Catches columns or masonry that re-place photos or remount images once the browser measures.
  it.each(['columns', 'masonry'] as const)(
    'keeps the server %s CSS and image nodes at 1200px and 800px containers',
    async (type) => {
      const ratios = [0.4, 2, 1, 0.7, 1.8, 0.3, 2.5, 1.2, 0.6, 1.4, 0.8, 3]
      const collection = Array.from({ length: 37 }, (_, index) =>
        makePhoto({
          id: `geometry-${index}`,
          width: ratios[(index * 17) % ratios.length]! * 1000,
          height: 1000,
        }),
      )
      const props = {
        photos: collection,
        layout: { type, columns: 3 },
        spacing: 24,
        padding: 4,
        lightbox: false,
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
        const host = document.createElement('div')
        host.innerHTML = await renderToString(createSSRApp({ render: () => h(PhotoAlbum, props) }))
        document.body.appendChild(host)
        const placement = () => ({
          css: host.querySelector('style')!.textContent,
          items: [...host.querySelectorAll('.np-album__item')].map(
            (item) => `${item.getAttribute('class')} ${item.getAttribute('style')}`,
          ),
        })
        const before = placement()
        const images = [...host.querySelectorAll('img')]
        const app = createSSRApp({ render: () => h(PhotoAlbum, props) })
        app.mount(host)
        await nextTick()
        try {
          expect(before.items).toHaveLength(37)
          expect(placement()).toEqual(before)
          expect(
            [...host.querySelectorAll('img')].every((image, index) => image === images[index]),
          ).toBe(true)
        } finally {
          app.unmount()
          host.remove()
        }
      }
    },
  )

  // Catches rows that hydrate, measure or append into different positions than the server sent.
  it('keeps the server rows CSS through hydration, resize and append', async () => {
    const collection = Array.from({ length: 37 }, (_, index) =>
      makePhoto({
        id: `row-${index}`,
        width: [400, 2000, 1000, 700, 1800][index % 5]!,
        height: 1000,
      }),
    )
    const items = ref(collection)
    const render = () =>
      h(PhotoAlbum, {
        photos: items.value,
        layout: 'rows',
        spacing: 24,
        padding: 4,
        lightbox: false,
      })
    const host = document.createElement('div')
    host.innerHTML = await renderToString(createSSRApp({ render }))
    document.body.appendChild(host)
    const css = () => host.querySelector('style')!.textContent!
    const itemStyles = () =>
      [...host.querySelectorAll<HTMLElement>('.np-album__item')].map((item) =>
        item.getAttribute('style'),
      )
    /** Row-end breaks shown by each container query span. */
    const breaks = () =>
      css()
        .split('\n')
        .map((rule) => [...rule.matchAll(/\.np-br-(\d+)/g)].map((match) => Number(match[1])))
    const before = { css: css(), styles: itemStyles() }
    expect(before.css).toContain('@container')
    const images = [...host.querySelectorAll('img')]
    const app = createSSRApp({ render })
    app.mount(host)
    await nextTick()
    try {
      expect(css()).toBe(before.css)
      expect(itemStyles()).toEqual(before.styles)
      expect(
        [...host.querySelectorAll('img')].every((image, index) => image === images[index]),
      ).toBe(true)
      resizeCallback(
        [
          {
            target: host.firstElementChild!,
            contentRect: new DOMRectReadOnly(0, 0, 950, 600),
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: [],
          },
        ],
        {} as ResizeObserver,
      )
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      await nextTick()
      expect(css()).toBe(before.css)

      const shown = breaks()
      items.value = [
        ...collection,
        ...collection.map((photo) => ({ ...photo, id: `${photo.id}-append` })),
      ]
      await nextTick()
      const appended = breaks()
      expect(appended).toHaveLength(shown.length)
      for (const [span, ends] of shown.entries()) {
        // Rows on screen keep their breaks; the old last photo now ends a row.
        expect(appended[span]!.filter((end) => end < collection.length)).toEqual([
          ...ends,
          collection.length - 1,
        ])
      }
    } finally {
      app.unmount()
      host.remove()
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
    // The lightbox finds thumbnails by this mark, so it must exist before hydration.
    expect(html).toContain(`data-np-photo-id="${photos[0]!.id}"`)
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
