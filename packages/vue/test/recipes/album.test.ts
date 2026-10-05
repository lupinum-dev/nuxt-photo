// @vitest-environment jsdom

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
