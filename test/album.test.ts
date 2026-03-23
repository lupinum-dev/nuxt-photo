// @vitest-environment jsdom

import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import PhotoAlbum from '../src/runtime/app/components/NuxtPhotoAlbum.vue'
import PhotoNativeImage from '../src/runtime/app/components/NuxtPhotoNativeImage.vue'
import PhotoNuxtImage from '../src/runtime/app/components/NuxtPhotoNuxtImage.vue'
import { computeColumnsLayout } from '../src/runtime/utils/columns'
import { computeMasonryLayout } from '../src/runtime/utils/masonry'
import type { PhotoItem } from '../src/runtime/types'

const items: PhotoItem[] = [
  { key: '1', src: '/one.jpg', width: 1600, height: 1200, alt: 'One' },
  { key: '2', src: '/two.jpg', width: 900, height: 1500, alt: 'Two' },
  { key: '3', src: '/three.jpg', width: 1800, height: 1200, alt: 'Three' },
  { key: '4', src: '/four.jpg', width: 1200, height: 1800, alt: 'Four' },
  { key: '5', src: '/five.jpg', width: 2200, height: 1200, alt: 'Five' },
  { key: '6', src: '/six.jpg', width: 1000, height: 1800, alt: 'Six' },
]

const showcaseItems: PhotoItem[] = [
  { key: '3', src: '/Gloesmann_Mobile.jpg', alt: 'Gloesmann Mobile Webdesign - Responsive Ansicht', height: 1152, width: 1536 },
  { key: '13', src: '/OfficeToGo_Mobile.jpg', alt: 'OfficeToGo Mobile App Design', height: 1152, width: 1536 },
  { key: '6', src: '/Obsidiosaurus.png', alt: 'Obsidiosaurus Branding und Logo Design', height: 1560, width: 2800 },
  { key: '8', src: '/Prem_Web.jpg', alt: 'Prem Webdesign - Desktop Ansicht', height: 2134, width: 1703 },
  { key: '2', src: '/OfficeToGo_Logo.png', alt: 'OfficeToGo Logo und Corporate Identity', height: 1048, width: 1656 },
  { key: '4', src: '/Vulkanrot.webp', alt: 'Vulkanrot Branding und Verpackungsdesign', height: 1350, width: 1080 },
  { key: '9', src: '/CIMSTA.png', alt: 'CIMSTA Website und Corporate Design', height: 1284, width: 1986 },
  { key: '10', src: '/Prem_Guidelines.png', alt: 'Prem Brand Guidelines und Styleguide', height: 1120, width: 1980 },
  { key: '11', src: '/6Sorten.jpg', alt: '6 Sorten Produktfotografie und Packaging Design', height: 4645, width: 3716 },
  { key: '1', src: '/Honigraum.jpg', alt: 'Honigraum Branding und Etikettendesign', height: 1509, width: 1536 },
  { key: '12', src: '/Bernstein_Mockup.png', alt: 'Bernstein Produktmockup und Branding', height: 2560, width: 3840 },
  { key: '14', src: '/Oreina.webp', alt: 'Oreina Corporate Identity und Webdesign', height: 1770, width: 2500 },
]

type ResizeObserverRecord = {
  target: Element
}

const resizeObserverState = {
  instances: [] as MockResizeObserver[],
}

class MockResizeObserver {
  observed: ResizeObserverRecord[] = []
  disconnect = vi.fn()

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserverState.instances.push(this)
  }

  observe = vi.fn((target: Element) => {
    this.observed.push({ target })
  })

  unobserve = vi.fn()

  trigger(width: number) {
    const entry = this.observed[0]
    if (!entry) {
      return
    }

    this.callback(
      [
        {
          contentRect: {
            width,
          },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    )
  }
}

const testImageStub = defineComponent({
  inheritAttrs: false,
  setup(_props, { attrs }) {
    return () => h('img', attrs)
  },
})

beforeEach(() => {
  resizeObserverState.instances = []
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.stubGlobal('matchMedia', vi.fn().mockImplementation(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: 1200,
  })
})

describe('PhotoAlbum', () => {
  it.each(['masonry', 'columns', 'rows'] as const)(
    'renders the %s layout from the canonical API',
    (layout) => {
      const wrapper = mount(PhotoAlbum, {
        props: {
          containerWidth: 960,
          columns: { 0: 2, 768: 3, 1280: 5 },
          items,
          layout,
          padding: 0,
          spacing: { 0: 16, 768: 20 },
          targetRowHeight: { 0: 180, 768: 220 },
        },
        global: {
          components: {
            PhotoImage: testImageStub,
          },
        },
      })

      expect(wrapper.find(`.photo-album--${layout}`).exists()).toBe(true)
      expect(wrapper.findAll('.photo-album__photo-button')).toHaveLength(items.length)
    },
  )

  it('styles the default album photo renderer without a custom slot', () => {
    const wrapper = mount(PhotoAlbum, {
      props: {
        containerWidth: 960,
        columns: { 0: 2, 768: 3, 1280: 5 },
        imageClass: 'custom-album-image',
        items,
        layout: 'masonry',
        padding: 0,
        photoClass: 'custom-album-photo',
        spacing: { 0: 16, 768: 20 },
        targetRowHeight: { 0: 180, 768: 220 },
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    const button = wrapper.find('.photo-album__photo-button')
    const image = button.find('img')

    expect(button.classes()).toContain('custom-album-photo')
    expect(image.classes()).toContain('custom-album-image')
  })

  it('keeps columns and masonry semantics distinct', () => {
    const layoutOptions = {
      columns: 3,
      containerWidth: 960,
      layout: 'columns' as const,
      padding: 0,
      spacing: 20,
    }
    const columns = computeColumnsLayout({
      items,
      layoutOptions,
    })
    const masonry = computeMasonryLayout({
      items,
      layoutOptions: {
        ...layoutOptions,
        layout: 'masonry',
      },
    })

    expect(columns?.columnsModel.map(column => column.map(({ item }) => item.key))).not.toEqual(
      masonry?.map(column => column.map(({ item }) => item.key)),
    )
  })

  it('bypasses ResizeObserver when containerWidth is controlled', async () => {
    mount(PhotoAlbum, {
      attachTo: document.body,
      props: {
        containerWidth: 960,
        columns: { 0: 2, 768: 3, 1280: 5 },
        items,
        layout: 'masonry',
        padding: 0,
        spacing: { 0: 16, 768: 20 },
        targetRowHeight: { 0: 180, 768: 220 },
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await nextTick()

    const observedTargets = resizeObserverState.instances.flatMap(instance =>
      instance.observed.map(({ target }) => target as HTMLElement),
    )

    expect(
      observedTargets.some(target => target.getAttribute('aria-hidden') === 'true'),
    ).toBe(false)
  })

  it('observes an inert probe instead of the layout root in auto mode', async () => {
    const wrapper = mount(PhotoAlbum, {
      attachTo: document.body,
      props: {
        defaultContainerWidth: 960,
        columns: { 0: 2, 768: 3, 1280: 5 },
        items,
        layout: 'masonry',
        padding: 0,
        spacing: { 0: 16, 768: 20 },
        targetRowHeight: { 0: 180, 768: 220 },
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await nextTick()
    await nextTick()

    const root = wrapper.find('.photo-album').element
    const observedTargets = resizeObserverState.instances.flatMap(instance =>
      instance.observed.map(({ target }) => target),
    )

    expect(observedTargets.length).toBeGreaterThan(0)
    expect(observedTargets.every(target => target !== root)).toBe(true)
    expect(
      observedTargets.some(
        target => (target as HTMLElement).getAttribute('aria-hidden') === 'true',
      ),
    ).toBe(true)
  })

  it('renders deterministic SSR markup with defaultContainerWidth', async () => {
    const app = createSSRApp({
      render: () =>
        h(PhotoAlbum, {
          defaultContainerWidth: 960,
          columns: { 0: 2, 768: 3, 1280: 5 },
          items,
          layout: 'masonry',
          padding: 0,
          spacing: { 0: 16, 768: 20 },
          targetRowHeight: { 0: 180, 768: 220 },
        }),
    })
    app.component('PhotoImage', testImageStub)

    const html = await renderToString(app)

    expect(html).toContain('photo-album--masonry')
    expect(html).toContain('img')
  })

  it('owns a local lightbox instance and syncs lightbox emits from photo clicks', async () => {
    const wrapper = mount(PhotoAlbum, {
      attachTo: document.body,
      props: {
        containerWidth: 960,
        columns: { 0: 2, 768: 3, 1280: 5 },
        items,
        layout: 'masonry',
        padding: 0,
        spacing: { 0: 16, 768: 20 },
        targetRowHeight: { 0: 180, 768: 220 },
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    const targetButton = wrapper.findAll('.photo-album__photo-button').find((candidate) => {
      return candidate.find('img').attributes('src') === '/two.jpg'
    })

    expect(targetButton).toBeDefined()
    await targetButton!.trigger('click')
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.emitted('lightbox-open')?.[0]?.[0]).toMatchObject({
      index: 1,
      item: expect.objectContaining({ src: '/two.jpg' }),
    })
    expect(wrapper.emitted('update:lightbox-index')?.at(-1)).toEqual([1])
    expect(document.body.querySelector('.photo-lightbox--open')).not.toBeNull()

    const lightbox = wrapper.findComponent({ name: 'NuxtPhotoLightbox' })
    ;(lightbox.vm as { close: () => void }).close()
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.emitted('lightbox-close')).toBeTruthy()
    expect(wrapper.emitted('update:lightbox-index')).toContainEqual([null])
  })

  it('falls back to native img when NuxtImg is unavailable', () => {
    const wrapper = mount(PhotoNativeImage, {
      attrs: {
        alt: 'One',
        densities: 'x1 x2',
        preset: 'showcase',
        sizes: '220px',
        src: '/one.jpg',
      },
    })

    expect(wrapper.find('img').exists()).toBe(true)
  })

  it('renders through the NuxtImg wrapper without forwarding manual srcset', () => {
    const wrapper = mount(PhotoNuxtImage, {
      attrs: {
        alt: 'One',
        sizes: '220px',
        src: '/one.jpg',
        srcset: '/one.jpg 320w',
      },
      global: {
        stubs: {
          NuxtImg: {
            template: '<img data-nuxt-img="true" v-bind="$attrs">',
          },
        },
      },
    })

    const image = wrapper.find('[data-nuxt-img="true"]')
    expect(image.exists()).toBe(true)
    expect(image.attributes('srcset')).toBeUndefined()
  })

  it('emits controlled lightbox hooks on selection', async () => {
    const wrapper = mount(PhotoAlbum, {
      attachTo: document.body,
      props: {
        containerWidth: 960,
        columns: { 0: 2, 768: 3, 1280: 5 },
        items,
        layout: 'columns',
        lightbox: true,
        padding: 0,
        spacing: { 0: 16, 768: 20 },
        targetRowHeight: { 0: 180, 768: 220 },
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    await wrapper.find('button').trigger('click')
    await nextTick()
    await Promise.resolve()
    await nextTick()

    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.emitted('update:lightbox-index')).toContainEqual([0])
    expect(wrapper.emitted('lightbox-open')).toHaveLength(1)
  })

  it('restores variable-width balanced columns for showcase-style data', () => {
    const wrapper = mount(PhotoAlbum, {
      props: {
        containerWidth: 1600,
        items: showcaseItems,
        layout: 'columns',
        columns: { 0: 5 },
        spacing: { 0: 20 },
        padding: 0,
      },
      global: {
        components: {
          PhotoImage: testImageStub,
        },
      },
    })

    const columns = wrapper.findAll('.photo-album__column')
    expect(columns).toHaveLength(5)

    const widths = columns.map(column => column.attributes('style'))
    expect(new Set(widths).size).toBeGreaterThan(1)
    expect(widths.some(width => (width ?? '').includes('*'))).toBe(true)

    const result = computeColumnsLayout({
      items: showcaseItems,
      layoutOptions: {
        columns: 5,
        containerWidth: 1600,
        layout: 'columns',
        padding: 0,
        spacing: 20,
      },
    })

    expect(result?.columnsModel.map(column => column.map(({ item }) => item.key))).toEqual([
      ['3', '13', '6'],
      ['8', '2'],
      ['4', '9'],
      ['10', '11'],
      ['1', '12', '14'],
    ])
    expect(result?.columnsRatios.map(value => Number(value.toFixed(4)))).toEqual([
      0.4861,
      0.5302,
      0.5273,
      0.5508,
      0.4243,
    ])
  })
})
