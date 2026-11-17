// @vitest-environment jsdom

import { createApp, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test'
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

  it.each(['rows', 'grid', 'bento', 'mosaic', 'accordion'] as const)(
    'evaluates %s function values at each planned width without a warning',
    async (type) => {
      const warn = vi.spyOn(console, 'warn')
      const spacing = vi.fn((width: number) => (width < 640 ? 4 : 8))
      const mounted = await mountComponent(PhotoAlbum, {
        props: {
          photos: [makePhoto({ id: 'function-value' })],
          layout: type,
          spacing,
          lightbox: false,
        },
      })
      expect(spacing.mock.calls.flat()).toEqual(
        expect.arrayContaining([320, 480, 640, 768, 1024, 1280, 1536, 1920, 2560]),
      )
      const css = mounted.container.querySelector('style')?.textContent ?? ''
      expect(css).toMatch(/\(width < 640px\)\{\.np-album__frame\{--np-gap:4px/)
      expect(css).toMatch(/\(width >= 640px\)\{\.np-album__frame\{--np-gap:8px/)
      expect(warn).not.toHaveBeenCalled()
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
    expect(document.querySelector('[data-np-active] .np-lightbox__caption')?.textContent).toContain(
      photos.find((photo) => photo.src === src)!.caption,
    )
    // Each mounted slide carries its own photo's caption; only the active one is read out.
    const slides = [...document.querySelectorAll<HTMLElement>('[data-np-slide]')]
    expect(slides.length).toBeGreaterThan(0)
    for (const slide of slides) {
      // Slides follow reading order, not `photos` order: find the photo by its image.
      const image = slide.querySelector('[data-np-slide-img]')!.getAttribute('src')
      const caption = slide.querySelector('.np-lightbox__caption')!
      expect(caption.textContent).toContain(photos.find((photo) => photo.src === image)!.caption)
      expect(caption.getAttribute('aria-hidden')).toBe(
        slide.hasAttribute('data-np-active') ? null : 'true',
      )
    }
    await album.value!.close()
    await flushUi()
    void album.value!.open(1)
    await flushUi()
    expect(document.querySelector('[data-np-active] .np-lightbox__caption')?.textContent).toContain(
      photos[1]!.caption,
    )
    app.unmount()
  })

  // Catch open(index) flying from, or hiding, the tile at that display position instead of
  // the tile that shows photos[index].
  it('flies from and hides the tile of photos[index] when opened programmatically', async () => {
    const photos = Array.from({ length: 12 }, (_, index) =>
      makePhoto({ id: `bento-${index}`, width: [1600, 900, 1200][index % 3], height: 1000 }),
    )
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 1200,
      height: 800,
      right: 1200,
      bottom: 800,
      x: 0,
      y: 0,
    } as DOMRect)
    // jsdom has no image decoding; the flight waits for the slide image to decode.
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: () => Promise.resolve(),
    })
    onTestFinished(() => {
      delete (HTMLImageElement.prototype as Partial<HTMLImageElement>).decode
    })
    const album = ref<{ open: (index: number) => Promise<void> }>()
    const mounted = await mountComponent({
      render: () => h(PhotoAlbum, { ref: album, photos, layout: 'bento', transition: 'flip' }),
    })
    const items = [...mounted.container.querySelectorAll<HTMLElement>('.np-album__item')]
    const target = items.find((item) => item.dataset.npPhotoId === photos[1]!.id)!
    expect(items.indexOf(target)).not.toBe(1)
    const targetRect = vi.fn(
      () =>
        ({
          left: 300,
          top: 0,
          width: 200,
          height: 150,
          right: 500,
          bottom: 150,
          x: 300,
          y: 0,
        }) as DOMRect,
    )
    target.getBoundingClientRect = targetRect

    void album.value!.open(1)
    await flushUi(12)

    expect(targetRect).toHaveBeenCalled()
    const hidden = items.filter(
      (item) => (item.firstElementChild as HTMLElement).style.opacity === '0',
    )
    expect(hidden).toEqual([target])
    mounted.unmount()
  })
})
