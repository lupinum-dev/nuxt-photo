// @vitest-environment jsdom

import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { responsive } from '@nuxt-photo/core'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'

const photos = [
  makePhoto({ id: 'hydrate-1', width: 1600, height: 900 }),
  makePhoto({ id: 'hydrate-2', width: 1200, height: 1500 }),
  makePhoto({ id: 'hydrate-3', width: 1500, height: 1000 }),
]

class ResizeObserverMock {
  observe() {}
  disconnect() {}
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

async function hydrateAlbum(props: Record<string, unknown>) {
  const ssrApp = createSSRApp({
    render: () => h(PhotoAlbum, props),
  })
  const html = await renderToString(ssrApp)

  const host = document.createElement('div')
  host.innerHTML = html
  document.body.appendChild(host)

  const app = createSSRApp({
    render: () => h(PhotoAlbum, props),
  })
  app.mount(host)
  await nextTick()

  return { host, app }
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 900,
      bottom: 600,
      width: 900,
      height: 600,
      toJSON: () => ({}),
    }),
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('SSR hydration', () => {
  it('hydrates columns snapshot SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'columns',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      breakpoints: [320, 800],
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    const messages = stringifyConsoleArgs([
      ...warn.mock.calls,
      ...error.mock.calls,
    ])
    expect(messages).not.toContain('Hydration text mismatch')
    expect(messages).not.toContain(
      'Hydration completed but contains mismatches',
    )

    app.unmount()
  })

  it('hydrates masonry snapshot SSR without Vue hydration mismatch warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { host, app } = await hydrateAlbum({
      photos,
      layout: {
        type: 'masonry',
        columns: responsive({ 0: 1, 800: 3 }),
      },
      breakpoints: [320, 800],
      lightbox: false,
    })

    const firstItem = host.querySelector('.np-album__item')
    expect(firstItem).not.toBeNull()

    const messages = stringifyConsoleArgs([
      ...warn.mock.calls,
      ...error.mock.calls,
    ])
    expect(messages).not.toContain('Hydration text mismatch')
    expect(messages).not.toContain(
      'Hydration completed but contains mismatches',
    )

    app.unmount()
  })

  it('accepts shorthand layout props without extraneous-attr warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { app } = await hydrateAlbum({
      photos,
      layout: 'rows',
      targetRowHeight: responsive({ 0: 180, 800: 240 }),
      breakpoints: [320, 800],
      lightbox: false,
    })

    const messages = stringifyConsoleArgs([
      ...warn.mock.calls,
      ...error.mock.calls,
    ])
    expect(messages).not.toContain('Extraneous non-props attributes')
    expect(messages).not.toContain('target-row-height')

    app.unmount()
  })
})
