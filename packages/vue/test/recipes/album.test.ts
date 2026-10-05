// @vitest-environment jsdom

import { createApp, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { reactive } from 'vue'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import { installBrowserStubs, mountComponent, flushUi } from '../support/runtime'

describe('PhotoAlbum', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it.each(['grid', 'bento', 'mosaic', 'accordion'] as const)(
    'samples %s function values at zero and warns once',
    async (type) => {
      const warn = vi.spyOn(console, 'warn')
      const spacing = vi.fn((width: number) => (width < 640 ? 4 : 8))
      const mounted = await mountComponent(PhotoAlbum, {
        props: {
          photos: [makePhoto({ id: 'function-value' })],
          layout: type,
          spacing,
          defaultContainerWidth: 900,
          lightbox: false,
        },
      })
      expect(spacing.mock.calls).toEqual([[0]])
      expect(warn).toHaveBeenCalledExactlyOnceWith(
        `[nuxt-photo] ${type} layout renders with CSS only; a function value needs responsive() or the breakpoints prop. Using its value at width 0.`,
      )
      expect(mounted.container.querySelector('style')?.textContent).toContain('--np-gap:4px')
      mounted.unmount()
      warn.mockRestore()
    },
  )

  it('forwards fallthrough attrs to its rendered album root', async () => {
    const onClick = vi.fn()
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'album-photo' })],
        lightbox: false,
        id: 'reviewed-album',
        class: 'consumer-album',
        'data-test-id': 'album-root',
        'aria-label': 'Reviewed photo album',
        onClick,
      },
    })
    const root = mounted.container.querySelector('.np-album') as HTMLElement

    expect(root.id).toBe('reviewed-album')
    expect(root.classList).toContain('consumer-album')
    expect(root.getAttribute('data-test-id')).toBe('album-root')
    expect(root.getAttribute('aria-label')).toBe('Reviewed photo album')

    root.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(onClick).toHaveBeenCalledOnce()
    mounted.unmount()
  })

  it('skips container-query CSS when defaultContainerWidth owns rendering', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'dcw-1' }), makePhoto({ id: 'dcw-2' })],
        lightbox: false,
        breakpoints: [400, 800],
        defaultContainerWidth: 800,
      },
    })

    // Inline widths are authoritative with dcw; emitting @container rules
    // alongside them would ship a stylesheet that can never apply.
    expect(mounted.container.querySelector('style')).toBeNull()

    const item = mounted.container.querySelector('.np-album__item') as HTMLElement
    expect(item.getAttribute('style')).toContain('calc(')
    expect(item.className).not.toContain('np-item-')

    mounted.unmount()
  })

  it('emits container-query CSS and item classes when breakpoints drive rendering', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'cq-1' }), makePhoto({ id: 'cq-2' })],
        lightbox: false,
        breakpoints: [400, 800],
      },
    })

    const style = mounted.container.querySelector('style')
    expect(style?.textContent).toContain('@container')

    mounted.unmount()
  })
  // Catches repeated fetches while the sentinel stays visible, and a lost notification after append.
  it('emits end-reached once per growth and disconnects on unmount', async () => {
    const callbacks: IntersectionObserverCallback[] = []
    const disconnect = vi.fn()
    const observe = vi.fn()
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(
          private callback: IntersectionObserverCallback,
          private options: IntersectionObserverInit,
        ) {}
        observe(target: Element) {
          observe(target)
          if (target.matches('.np-album__end')) {
            expect(this.options.rootMargin).toBe(`0px 0px ${window.innerHeight}px 0px`)
            callbacks.push(this.callback)
          }
        }
        unobserve() {}
        disconnect = disconnect
      },
    )
    const onEndReached = vi.fn()
    const props = reactive({ photos: [makePhoto({ id: 'one' })], lightbox: false, onEndReached })
    const mounted = await mountComponent(PhotoAlbum, { props })
    const notify = (intersects: boolean) =>
      callbacks.at(-1)!(
        [{ isIntersecting: intersects } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    notify(false)
    expect(onEndReached).not.toHaveBeenCalled()
    notify(true)
    notify(true)
    expect(onEndReached).toHaveBeenCalledTimes(1)
    const previousCallback = callbacks.at(-1)!
    props.photos.push(makePhoto({ id: 'two' }))
    await flushUi()
    previousCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    )
    expect(onEndReached).toHaveBeenCalledTimes(1)
    notify(true)
    notify(true)
    expect(onEndReached).toHaveBeenCalledTimes(2)
    expect(observe).toHaveBeenCalledWith(mounted.container.querySelector('.np-album__end'))
    mounted.unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})

describe('bento lightbox order', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('opens the second DOM item in reading order while open(index) uses the photos prop', async () => {
    const photos = Array.from({ length: 12 }, (_, index) =>
      makePhoto({ id: `bento-${index}`, width: [1600, 900, 1200][index % 3], height: 1000 }),
    )
    const album = ref<{ open: (index: number) => Promise<void>; close: () => Promise<void> }>()
    const host = document.createElement('div')
    document.body.appendChild(host)
    const app = createApp({
      render: () => h(PhotoAlbum, { ref: album, photos, layout: 'bento', transition: 'none' }),
    })
    app.mount(host)
    await flushUi()
    const second = host.querySelectorAll<HTMLElement>('.np-album__item')[1]!
    const src = second.querySelector('img')!.getAttribute('src')
    expect(src).not.toBe(photos[1]!.src)
    second.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await flushUi()
    expect(document.querySelector('.np-lightbox__counter')?.textContent).toContain('2 / 12')
    expect(document.querySelector('.np-lightbox__caption')?.textContent).toContain(
      photos.find((photo) => photo.src === src)!.caption,
    )
    await album.value!.close()
    await flushUi()
    void album.value!.open(1)
    await flushUi()
    expect(document.querySelector('.np-lightbox__caption')?.textContent).toContain(
      photos[1]!.caption,
    )
    app.unmount()
  })
})
