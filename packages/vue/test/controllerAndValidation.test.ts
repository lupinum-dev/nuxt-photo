// @vitest-environment jsdom

import { createApp, defineComponent, h, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import Photo from '../src/components/Photo.vue'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoCarousel from '../src/components/PhotoCarousel.vue'
import { flushUi, installBrowserStubs, mountComponent } from './support/runtime'

/** Mount with a template ref so exposed controllers are reachable. */
function mountWithRef(component: any, props: Record<string, any> = {}) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const handle = ref<any>(null)
  const app = createApp(defineComponent(() => () => h(component, { ...props, ref: handle })))
  app.mount(container)

  return {
    app,
    container,
    get handle() {
      return handle.value
    },
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

/**
 * jsdom images never fire load events, so the lightbox's decode wait would
 * run to its full timeout. Settle every mounted slide image explicitly.
 */
async function settleSlideImage() {
  await flushUi()
  for (const img of document.body.querySelectorAll('img[data-np-slide-img]')) {
    img.dispatchEvent(new Event('load'))
  }
  await flushUi()
}

describe('programmatic lightbox controllers', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('exposes open/close/isOpen on PhotoAlbum', async () => {
    const mounted = mountWithRef(PhotoAlbum, {
      photos: [makePhoto({ id: 'ctl-1' }), makePhoto({ id: 'ctl-2' })],
      transition: 'none',
    })

    expect(mounted.handle.open).toBeTypeOf('function')
    expect(mounted.handle.openById).toBeTypeOf('function')
    expect(mounted.handle.close).toBeTypeOf('function')
    expect(mounted.handle.isOpen).toBe(false)

    const opening = mounted.handle.open(1)
    await settleSlideImage()
    await opening

    const dialog = document.body.querySelector('[role="dialog"]')
    expect(dialog).not.toBeNull()
    expect(mounted.handle.isOpen).toBe(true)

    const closing = mounted.handle.close()
    await flushUi()
    await closing
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    expect(mounted.handle.isOpen).toBe(false)

    mounted.unmount()
  })

  it('opens a solo Photo through its exposed controller', async () => {
    const mounted = mountWithRef(Photo, {
      photo: makePhoto({ id: 'solo-ctl' }),
      lightbox: true,
      transition: 'none',
    })

    const opening = mounted.handle.open()
    await settleSlideImage()
    await opening
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()

    const closing = mounted.handle.close()
    await flushUi()
    await closing
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    mounted.unmount()
  })
})

describe('Photo validation policy', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('renders nothing instead of throwing when validation is drop', async () => {
    const mounted = await mountComponent(Photo, {
      props: {
        photo: { id: '', src: '/bad.jpg', width: -1, height: -1 } as any,
        validation: 'drop',
      },
    })

    expect(mounted.container.querySelector('figure')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()

    mounted.unmount()
  })

  it('still throws by default for invalid photos', async () => {
    await expect(
      mountComponent(Photo, {
        props: { photo: { id: '', src: '/bad.jpg', width: 10, height: 10 } as any },
      }),
    ).rejects.toThrow(/non-empty string id/)
  })
})

describe('PhotoAlbum sizes passthrough', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('passes a plain HTML sizes string through verbatim', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'sz-1' }), makePhoto({ id: 'sz-2' })],
        defaultContainerWidth: 800,
        sizes: '(min-width: 600px) 50vw, 100vw',
      },
    })

    const img = mounted.container.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('sizes')).toBe('(min-width: 600px) 50vw, 100vw')

    mounted.unmount()
  })

  it('derives layout-exact calc() sizes from the structured form', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'sz-3' })],
        defaultContainerWidth: 800,
        spacing: 0,
        padding: 0,
        sizes: { size: '100vw' },
      },
    })

    const img = mounted.container.querySelector('img') as HTMLImageElement
    const sizes = img.getAttribute('sizes') ?? ''
    expect(sizes).toContain('calc((100vw - 0px) /')

    mounted.unmount()
  })
})

describe('PhotoCarousel flat options and default lightbox', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  function stubCarouselGeometry() {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    )
  }

  it('opens the lightbox by default when a slide is activated', async () => {
    stubCarouselGeometry()
    const mounted = await mountComponent(PhotoCarousel, {
      props: {
        photos: [makePhoto({ id: 'car-1' }), makePhoto({ id: 'car-2' })],
        transition: 'none',
      },
    })

    const slide = mounted.container.querySelector('[role="button"]') as HTMLElement
    slide.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushUi()

    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()

    mounted.unmount()
  })

  it('accepts flat loop and slidesToScroll props', async () => {
    stubCarouselGeometry()
    const mounted = await mountComponent(PhotoCarousel, {
      props: {
        photos: [makePhoto({ id: 'car-3' }), makePhoto({ id: 'car-4' })],
        loop: true,
        slidesToScroll: 2,
        lightbox: false,
      },
    })

    expect(mounted.container.querySelector('.np-carousel')).not.toBeNull()
    mounted.unmount()
  })

  it('prefers flat props over the deprecated options bag', async () => {
    stubCarouselGeometry()
    const mounted = await mountComponent(PhotoCarousel, {
      props: {
        photos: [makePhoto({ id: 'car-5' }), makePhoto({ id: 'car-6' })],
        slidesToScroll: 2,
        options: { slidesToScroll: 1 },
        lightbox: false,
      },
    })

    expect(mounted.container.querySelector('.np-carousel')).not.toBeNull()
    mounted.unmount()
  })
})
