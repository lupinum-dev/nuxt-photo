// @vitest-environment jsdom

import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PhotoAlbum, PhotoGallery, PhotoImg, PhotoLightbox, usePhotoLightbox } from '../src/runtime'
import type { ComponentPublicInstance } from 'vue'
import type {
  LightboxImageItem,
  LightboxControlsSlotProps,
  LightboxItem,
  LightboxOptions,
} from '../src/runtime/types'

const testImageStub = defineComponent({
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () => h('img', attrs)
  },
})

function createSlides(): LightboxImageItem[] {
  return [
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/1/img-2500.jpg',
      width: 1875,
      height: 2500,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/1/img-200.jpg',
      alt: 'Mountain landscape',
    },
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/2/img-2500.jpg',
      width: 1669,
      height: 2500,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/2/img-200.jpg',
      alt: 'Foggy forest',
    },
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/3/img-2500.jpg',
      width: 2500,
      height: 1666,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/3/img-200.jpg',
      alt: 'Valley view',
    },
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/4/img-2500.jpg',
      width: 2500,
      height: 1667,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/4/img-200.jpg',
      alt: 'Misty mountains',
    },
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/5/img-2500.jpg',
      width: 2500,
      height: 1668,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/5/img-200.jpg',
      alt: 'Autumn road',
    },
    {
      src: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/6/img-2500.jpg',
      width: 2500,
      height: 1667,
      msrc: 'https://cdn.photoswipe.com/photoswipe-demo-images/photos/6/img-200.jpg',
      alt: 'Lake reflection',
    },
  ]
}

function createBaseOptions(extra: LightboxOptions = {}): LightboxOptions {
  return {
    openAnimation: 'none',
    closeAnimation: 'none',
    showDuration: 0,
    hideDuration: 0,
    getViewportSizeFn: () => ({ x: 1200, y: 800 }),
    ...extra,
  }
}

type ThumbRect = {
  left: number
  top: number
  width: number
  height: number
}

function createThumbElement(widthOrRect: number | Partial<ThumbRect> = 150, height = 200): HTMLImageElement {
  const rect = typeof widthOrRect === 'number'
    ? {
        left: 0,
        top: 0,
        width: widthOrRect,
        height,
      }
    : widthOrRect
  const width = rect.width ?? 150
  const img = document.createElement('img')
  Object.defineProperty(img, 'naturalWidth', { configurable: true, value: width })
  Object.defineProperty(img, 'naturalHeight', { configurable: true, value: rect.height ?? height })
  Object.defineProperty(img, 'complete', { configurable: true, value: true })
  img.getBoundingClientRect = () =>
    ({
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      top: rect.top ?? 0,
      left: rect.left ?? 0,
      right: (rect.left ?? 0) + (rect.width ?? width),
      bottom: (rect.top ?? 0) + (rect.height ?? height),
      width: rect.width ?? width,
      height: rect.height ?? height,
      toJSON() {
        return {}
      },
    }) as DOMRect

  return img
}

function mockImageDecode() {
  Object.defineProperty(HTMLImageElement.prototype, 'decode', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  })
}

function getRenderedSlideSources(): string[] {
  return Array.from(document.body.querySelectorAll('.photo-lightbox__item')).map((holder) => {
    const img = holder.querySelector('img.photo-lightbox__img:not(.photo-lightbox__img--placeholder)') as HTMLImageElement | null
    return img?.src || ''
  }).filter(Boolean)
}

function getDebugLogDetails(
  spy: ReturnType<typeof vi.spyOn>,
  scope: string,
): Record<string, unknown>[] {
  return spy.mock.calls
    .filter((call: unknown[]) => call[0] === `[photo-lightbox] ${scope}`)
    .map((call: unknown[]) => call[1] as Record<string, unknown>)
}

async function flushLightbox(): Promise<void> {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function setDocumentClientWidth(width: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    configurable: true,
    value: width,
  })
}

beforeEach(() => {
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
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('usePhotoLightbox controller', () => {
  it('creates a fresh session per open and retains controller listeners', async () => {
    const controller = usePhotoLightbox({
      items: createSlides(),
      options: createBaseOptions(),
    })
    let destroyCount = 0
    const seenSessionIds: number[] = []

    controller.hooks.onDestroy(() => {
      destroyCount += 1
      seenSessionIds.push(controller.state.sessionId.value)
    })

    const first = controller.open({ index: 2, openSource: 'test' })
    expect(first).toBe(true)
    expect(controller.state.sessionId.value).toBe(1)
    expect(controller.state.currIndex.value).toBe(2)

    controller.close()
    await flushLightbox()
    expect(controller.state.isOpen.value).toBe(false)
    expect(controller.state.transitionPhase.value).toBe('idle')

    const second = controller.open({ index: 1, openSource: 'test' })
    expect(second).toBe(true)
    expect(controller.state.sessionId.value).toBe(2)
    expect(controller.state.currIndex.value).toBe(1)

    controller.close()
    await flushLightbox()

    expect(destroyCount).toBe(2)
    expect(seenSessionIds).toEqual([1, 2])
  })

  it('does not mutate caller items when correcting dimensions from a thumbnail element', async () => {
    const slides = createSlides()
    const original = { ...slides[0] }
    const controller = usePhotoLightbox({
      items: slides,
      options: createBaseOptions({
        openAnimation: 'zoom',
        closeAnimation: 'zoom',
      }),
    })

    const thumb = createThumbElement(120, 120)
    controller.open({ index: 0, sourceElement: thumb, openSource: 'test' })
    await flushLightbox()

    expect(slides[0]).toEqual(original)
  })

  it('keeps zoom transitions when thumbnail geometry is trustworthy', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const controller = usePhotoLightbox({
      items: createSlides(),
      options: createBaseOptions({
        debug: true,
        openAnimation: 'zoom',
        closeAnimation: 'zoom',
        showDuration: 120,
        hideDuration: 120,
      }),
    })

    controller.open({
      index: 0,
      sourceElement: createThumbElement(150, 200),
      openSource: 'test',
    })
    await flushLightbox()

    const openDecision = getDebugLogDetails(debugSpy, 'opener.applyStartProps')
      .find(details => details.phase === 'open')

    expect(openDecision).toMatchObject({
      phase: 'open',
      requestedMode: 'zoom',
      resolvedMode: 'zoom',
      fallbackReason: undefined,
    })
  })

  it('uses graceful fade when declared dimensions are missing', async () => {
    vi.useFakeTimers()
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const slides = createSlides()
    slides[0] = {
      ...slides[0]!,
      width: 0,
      height: 0,
    }

    const controller = usePhotoLightbox({
      items: slides,
      options: createBaseOptions({
        debug: true,
        openAnimation: 'zoom',
        closeAnimation: 'zoom',
        showDuration: 120,
      }),
    })

    controller.open({
      index: 0,
      sourceElement: createThumbElement(150, 200),
      openSource: 'test',
    })
    await flushLightbox()
    vi.runAllTimers()
    await flushLightbox()

    const openDecision = getDebugLogDetails(debugSpy, 'opener.applyStartProps')
      .find(details => details.phase === 'open')
    const initiate = getDebugLogDetails(debugSpy, 'opener.initiate').at(-1)

    expect(openDecision).toMatchObject({
      phase: 'open',
      requestedMode: 'zoom',
      resolvedMode: 'fade',
      fallbackReason: 'missing-declared-dimensions',
    })
    expect(initiate).toMatchObject({
      animateZoom: false,
      animateFadeScale: true,
    })
  })

  it('uses graceful fade when declared and natural aspect ratios diverge', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const controller = usePhotoLightbox({
      items: createSlides(),
      options: createBaseOptions({
        debug: true,
        openAnimation: 'zoom',
        showDuration: 120,
      }),
    })

    controller.open({
      index: 0,
      sourceElement: createThumbElement(120, 120),
      openSource: 'test',
    })
    await flushLightbox()

    const openDecision = getDebugLogDetails(debugSpy, 'opener.applyStartProps')
      .find(details => details.phase === 'open')

    expect(openDecision).toMatchObject({
      phase: 'open',
      requestedMode: 'zoom',
      resolvedMode: 'fade',
      fallbackReason: 'aspect-ratio-mismatch',
    })
  })

  it('uses graceful fade when the clicked thumbnail is mostly offscreen', async () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const controller = usePhotoLightbox({
      items: createSlides(),
      options: createBaseOptions({
        debug: true,
        openAnimation: 'zoom',
        showDuration: 120,
      }),
    })

    controller.open({
      index: 0,
      sourceElement: createThumbElement({ left: -140, top: 0, width: 200, height: 200 }),
      openSource: 'test',
    })
    await flushLightbox()

    const openDecision = getDebugLogDetails(debugSpy, 'opener.applyStartProps')
      .find(details => details.phase === 'open')

    expect(openDecision).toMatchObject({
      phase: 'open',
      requestedMode: 'zoom',
      resolvedMode: 'fade',
      fallbackReason: 'insufficient-thumb-visibility',
    })
  })

  it('keeps close behavior symmetric when open used graceful fade fallback', async () => {
    vi.useFakeTimers()
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const slides = createSlides()
    slides[0] = {
      ...slides[0]!,
      width: 0,
      height: 0,
    }

    const controller = usePhotoLightbox({
      items: slides,
      options: createBaseOptions({
        debug: true,
        openAnimation: 'zoom',
        closeAnimation: 'zoom',
        showDuration: 120,
        hideDuration: 120,
      }),
    })

    controller.open({
      index: 0,
      sourceElement: createThumbElement(150, 200),
      openSource: 'test',
    })
    await flushLightbox()
    await vi.runAllTimersAsync()
    await flushLightbox()

    controller.close()
    await flushLightbox()

    const closeDecision = getDebugLogDetails(debugSpy, 'opener.applyStartProps')
      .find(details => details.phase === 'close')

    expect(closeDecision).toMatchObject({
      phase: 'close',
      requestedMode: 'zoom',
      resolvedMode: 'fade',
      fallbackReason: 'open-fallback-sync',
    })
  })

  it('disables the new fallback animation under reduced motion', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia

    const controller = usePhotoLightbox({
      items: createSlides(),
      options: {
        openAnimation: 'zoom',
        closeAnimation: 'zoom',
      },
    })

    expect(controller.options.value.openAnimationType).toBe('none')
    expect(controller.options.value.closeAnimationType).toBe('none')
  })
})

describe('PhotoLightbox', () => {
  it('locks body scroll and preserves the scrollbar gutter while open', async () => {
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: createSlides(),
        options: createBaseOptions(),
        teleportTo: 'body',
      },
    })

    setDocumentClientWidth(1183)

    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('17px')

    ;(wrapper.vm as { close: () => void }).close()
    await flushLightbox()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')

    wrapper.unmount()
  })

  it('does not add compensating padding when no scrollbar gap exists', async () => {
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: createSlides(),
        options: createBaseOptions(),
        teleportTo: 'body',
      },
    })

    setDocumentClientWidth(1200)

    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(document.body.style.overflow).toBe('hidden')
    expect(document.body.style.paddingRight).toBe('')

    ;(wrapper.vm as { close: () => void }).close()
    await flushLightbox()

    wrapper.unmount()
  })

  it('preserves existing body padding-right and restores inline styles on close', async () => {
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: createSlides(),
        options: createBaseOptions(),
        teleportTo: 'body',
      },
    })

    document.body.style.paddingRight = '8px'
    setDocumentClientWidth(1183)

    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(document.body.style.paddingRight).toBe('25px')

    ;(wrapper.vm as { close: () => void }).close()
    await flushLightbox()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('8px')

    wrapper.unmount()
  })

  it('keeps the body locked until close teardown finishes', async () => {
    vi.useFakeTimers()

    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: createSlides(),
        options: createBaseOptions({
          closeAnimation: 'fade',
          hideDuration: 100,
        }),
        teleportTo: 'body',
      },
    })

    setDocumentClientWidth(1183)

    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(document.body.style.overflow).toBe('hidden')

    ;(wrapper.vm as { close: () => void }).close()
    await nextTick()

    expect(document.body.style.overflow).toBe('hidden')

    vi.advanceTimersByTime(700)
    await flushLightbox()

    expect(document.body.style.overflow).toBe('')
    expect(document.body.style.paddingRight).toBe('')

    wrapper.unmount()
  })

  it('exposes a headless controls slot API', async () => {
    const slides = createSlides()
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: slides,
        options: createBaseOptions({ loop: true }),
        teleportTo: 'body',
      },
      slots: {
        controls: ({
          close,
          controller,
          next,
          options,
          prev,
          setUiVisible,
          state,
          toggleZoom,
        }: LightboxControlsSlotProps) => h('div', { class: 'controls-slot' }, [
          h('button', { class: 'controls-prev', onClick: prev }, 'Prev'),
          h('button', { class: 'controls-next', onClick: next }, 'Next'),
          h('button', { class: 'controls-close', onClick: close }, 'Close'),
          h('button', { class: 'controls-zoom', onClick: toggleZoom }, 'Zoom'),
          h('button', { class: 'controls-show-ui', onClick: () => setUiVisible(true) }, 'Show UI'),
          h('button', { class: 'controls-hide-ui', onClick: () => setUiVisible(false) }, 'Hide UI'),
          h('span', { class: 'controls-total' }, String(state.totalItems.value)),
          h('span', { class: 'controls-open' }, String(state.isOpen.value)),
          h('span', { class: 'controls-ui' }, String(state.uiVisible.value)),
          h('span', { class: 'controls-loop' }, String(options?.loop)),
          h('span', { class: 'controls-controller' }, String(typeof controller.open === 'function')),
        ]),
      },
    })

    const controlsRoot = () => document.body.querySelector('.controls-slot')
    const controlsText = (selector: string) =>
      document.body.querySelector(selector)?.textContent

    expect(controlsRoot()).not.toBeNull()
    expect(controlsText('.controls-total')).toBe(String(slides.length))
    expect(controlsText('.controls-open')).toBe('false')
    expect(controlsText('.controls-ui')).toBe('false')
    expect(controlsText('.controls-loop')).toBe('true')
    expect(controlsText('.controls-controller')).toBe('true')

    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()
    expect(controlsText('.controls-open')).toBe('true')

    await document.body.querySelector<HTMLButtonElement>('.controls-show-ui')?.click()
    await flushLightbox()
    expect(controlsText('.controls-ui')).toBe('true')

    await document.body.querySelector<HTMLButtonElement>('.controls-hide-ui')?.click()
    await flushLightbox()
    expect(controlsText('.controls-ui')).toBe('false')

    await document.body.querySelector<HTMLButtonElement>('.controls-close')?.click()
    await flushLightbox()
    expect(controlsText('.controls-open')).toBe('false')
  })

  it('reopens with the correct looped prev/current/next slides', async () => {
    const slides = createSlides()
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: slides,
        options: createBaseOptions({ loop: true }),
        teleportTo: 'body',
      },
    })

    await flushLightbox()
    ;(wrapper.vm as { open: (index?: number) => void }).open(1)
    await flushLightbox()

    expect(getRenderedSlideSources()).toEqual([
      slides[0]!.src,
      slides[1]!.src,
      slides[2]!.src,
    ])

    ;(wrapper.vm as { close: () => void }).close()
    await flushLightbox()
    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(getRenderedSlideSources()).toEqual([
      slides[5]!.src,
      slides[0]!.src,
      slides[1]!.src,
    ])
  })

  it('reacts to item removals while open and clamps the current slide index', async () => {
    const slides = createSlides()
    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items: slides,
        options: createBaseOptions(),
        teleportTo: 'body',
      },
    })

    await flushLightbox()
    ;(wrapper.vm as { open: (index?: number) => void }).open(5)
    await flushLightbox()

    await wrapper.setProps({ items: slides.slice(0, 2) })
    await flushLightbox()

    expect((wrapper.vm as { currIndex: number }).currIndex).toBe(1)
    expect(getRenderedSlideSources()[1]).toBe(slides[1]!.src)
  })

  it('renders custom slide content through the Vue slide slot', async () => {
    const items: LightboxItem[] = [
      { type: 'custom', width: 800, height: 600, title: 'Custom slide' },
    ]

    const wrapper = mount(PhotoLightbox, {
      attachTo: document.body,
      props: {
        items,
        options: createBaseOptions(),
        teleportTo: 'body',
      },
      slots: {
        slide: ({ item }: { item: LightboxItem }) =>
          h('div', { class: 'custom-slide-body' }, String(item.title)),
      },
    })

    await flushLightbox()
    ;(wrapper.vm as { open: (index?: number) => void }).open(0)
    await flushLightbox()

    expect(document.body.querySelector('.custom-slide-body')?.textContent).toBe('Custom slide')
  })
})

describe('PhotoGallery', () => {
  it('forwards the controls slot to the inner lightbox shell', async () => {
    const slides = createSlides()
    mount(PhotoGallery, {
      attachTo: document.body,
      props: {
        items: slides,
        options: createBaseOptions(),
        teleportTo: 'body',
      },
      slots: {
        controls: ({ state }: { state: ReturnType<typeof usePhotoLightbox>['state'] }) =>
          h('div', { class: 'gallery-controls' }, String(state.totalItems.value)),
      },
    })

    expect(document.body.querySelector('.gallery-controls')?.textContent).toBe(String(slides.length))
  })

  it('opens the clicked thumb index across sessions using registered thumbnail refs', async () => {
    mockImageDecode()
    const slides = createSlides()
    const wrapper = mount(PhotoGallery, {
      attachTo: document.body,
      props: {
        items: slides,
        options: createBaseOptions(),
        teleportTo: 'body',
      },
      slots: {
        thumbnail: ({ item, open, bindThumbnail }: {
          item: LightboxItem
          open: (event?: MouseEvent) => void
          bindThumbnail: (target: Element | ComponentPublicInstance | null) => void
        }) =>
          h(
            'button',
            {
              ref: bindThumbnail as (target: Element | ComponentPublicInstance | null) => void,
              class: 'gallery-thumb',
              onClick: (event: MouseEvent) => open(event),
            },
            [
              h('img', {
                src: 'src' in item ? item.msrc : undefined,
                alt: 'alt' in item ? item.alt : undefined,
              }),
            ],
          ),
      },
    })

    await flushLightbox()
    const thumbs = wrapper.findAll('button.gallery-thumb')

    await thumbs[1]!.trigger('click')
    await flushLightbox()
    expect(getRenderedSlideSources()[1]).toBe(slides[1]!.src)

    ;(wrapper.findComponent(PhotoLightbox).vm as { close: () => void }).close()
    await flushLightbox()

    await thumbs[4]!.trigger('click')
    await flushLightbox()
    expect(getRenderedSlideSources()[1]).toBe(slides[4]!.src)
  })
})

describe('PhotoImg', () => {
  it('renders a native button trigger and keeps the caption outside it', () => {
    const wrapper = mount(PhotoImg, {
      props: {
        src: 'https://example.com/standalone.jpg',
        alt: 'Standalone',
        caption: 'Caption',
        description: 'Description',
        width: 1600,
        height: 1200,
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    const figure = wrapper.find('figure.photo-img')
    const trigger = wrapper.find('[data-slot="photo-trigger"]')
    const caption = wrapper.find('figcaption.photo-img__caption')

    expect(figure.exists()).toBe(true)
    expect(trigger.element.tagName).toBe('BUTTON')
    expect(trigger.attributes('type')).toBe('button')
    expect(caption.exists()).toBe(true)
    expect(caption.element.closest('[data-slot="photo-trigger"]')).toBeNull()
  })

  it('opens its own local lightbox without shared group state', async () => {
    mockImageDecode()

    const wrapper = mount(PhotoImg, {
      attachTo: document.body,
      props: {
        src: 'https://example.com/standalone.jpg',
        alt: 'Standalone',
        width: 1600,
        height: 1200,
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await wrapper.find('[data-slot="photo-trigger"]').trigger('click')
    await flushLightbox()

    expect(document.body.querySelector('.photo-lightbox--open')).not.toBeNull()
    expect(getRenderedSlideSources()[0]).toContain('https://example.com/standalone.jpg')
  })

  it('passes the controls slot through to the internal lightbox', async () => {
    const wrapper = mount(PhotoImg, {
      attachTo: document.body,
      props: {
        src: 'https://example.com/standalone.jpg',
        alt: 'Standalone',
        width: 1600,
        height: 1200,
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
      slots: {
        controls: ({ close, state }: LightboxControlsSlotProps) =>
          h('div', { class: 'img-controls-slot' }, [
            h('button', { class: 'img-controls-close', onClick: close }, 'Close'),
            h('span', { class: 'img-controls-open' }, String(state.isOpen.value)),
          ]),
      },
    })

    expect(document.body.querySelector('.img-controls-slot')).not.toBeNull()

    await wrapper.find('[data-slot="photo-trigger"]').trigger('click')
    await flushLightbox()
    expect(document.body.querySelector('.img-controls-open')?.textContent).toBe('true')

    await document.body.querySelector<HTMLButtonElement>('.img-controls-close')?.click()
    await flushLightbox()
    expect(document.body.querySelector('.img-controls-open')?.textContent).toBe('false')
  })

  it('uses thumbnailSrc for the inline image while opening the full source in the lightbox', async () => {
    mockImageDecode()

    const wrapper = mount(PhotoImg, {
      attachTo: document.body,
      props: {
        src: 'https://example.com/full.jpg',
        thumbnailSrc: 'https://example.com/thumb.jpg',
        alt: 'Standalone',
        width: 1600,
        height: 1200,
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    expect(wrapper.find('img').attributes('src')).toBe('https://example.com/thumb.jpg')

    await wrapper.find('[data-slot="photo-trigger"]').trigger('click')
    await flushLightbox()

    expect(getRenderedSlideSources()[0]).toContain('https://example.com/full.jpg')
  })

  it('shares one grouped lightbox within the same app tree', async () => {
    mockImageDecode()

    const wrapper = mount(defineComponent({
      components: { PhotoImg },
      template: `
        <div>
          <PhotoImg
            src="https://example.com/group-a.jpg"
            alt="A"
            :width="1600"
            :height="1200"
            group="portfolio"
            :lightbox="options"
          />
          <PhotoImg
            src="https://example.com/group-b.jpg"
            alt="B"
            :width="1600"
            :height="1200"
            group="portfolio"
            :lightbox="options"
          />
        </div>
      `,
      setup() {
        return { options: createBaseOptions() }
      },
    }), {
      attachTo: document.body,
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await wrapper.findAll('[data-slot="photo-trigger"]')[1]!.trigger('click')
    await flushLightbox()

    expect(getRenderedSlideSources()).toEqual([
      'https://example.com/group-a.jpg',
      'https://example.com/group-b.jpg',
    ])
  })

  it('does not leak grouped state across separate app instances', async () => {
    mockImageDecode()

    const first = mount(PhotoImg, {
      attachTo: document.body,
      props: {
        src: 'https://example.com/app-one.jpg',
        alt: 'App One',
        width: 1600,
        height: 1200,
        group: 'shared-id',
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    mount(PhotoImg, {
      attachTo: document.body,
      props: {
        src: 'https://example.com/app-two.jpg',
        alt: 'App Two',
        width: 1600,
        height: 1200,
        group: 'shared-id',
        lightbox: createBaseOptions(),
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await first.find('[data-slot="photo-trigger"]').trigger('click')
    await flushLightbox()

    expect(getRenderedSlideSources()).toEqual([
      'https://example.com/app-one.jpg',
    ])
  })
})

describe('PhotoAlbum', () => {
  it('passes the controls slot through to the internal lightbox', async () => {
    const wrapper = mount(PhotoAlbum, {
      attachTo: document.body,
      props: {
        items: createSlides().slice(0, 3),
        layout: 'masonry',
        columns: { 0: 2 },
        spacing: { 0: 8 },
        padding: 0,
        targetRowHeight: { 0: 240 },
        lightbox: createBaseOptions(),
        containerWidth: 960,
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
      slots: {
        controls: ({ close, state }: LightboxControlsSlotProps) =>
          h('div', { class: 'album-controls-slot' }, [
            h('button', { class: 'album-controls-close', onClick: close }, 'Close'),
            h('span', { class: 'album-controls-index' }, String(state.currIndex.value)),
            h('span', { class: 'album-controls-open' }, String(state.isOpen.value)),
          ]),
      },
    })

    expect(document.body.querySelector('.album-controls-slot')).not.toBeNull()

    await wrapper.find('.photo-album__photo-button').trigger('click')
    await flushLightbox()

    expect(document.body.querySelector('.album-controls-open')?.textContent).toBe('true')
    expect(document.body.querySelector('.album-controls-index')?.textContent).toBe('0')

    await document.body.querySelector<HTMLButtonElement>('.album-controls-close')?.click()
    await flushLightbox()
    expect(document.body.querySelector('.album-controls-open')?.textContent).toBe('false')
  })
})
