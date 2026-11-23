// @vitest-environment jsdom

import { computed, defineComponent, h, inject, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import type { PhotoItem } from '../../src/core/index'
import type { GalleryHandle } from '../../src'
import { useLightbox } from '../../src/composables'
import Photo from '../../src/components/Photo.vue'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoCarousel from '../../src/components/PhotoCarousel.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupContext,
} from '../../src/components/photo-group/context'
import { flushUi, installBrowserStubs, mountComponent } from '../support/runtime'

const ProbeLightbox = defineComponent(() => {
  const controller = useLightbox()
  return () =>
    h('div', [
      h(
        'output',
        { 'data-testid': 'group-photos' },
        controller.photos.value.map((photo) => photo.id).join(','),
      ),
      h('output', { 'data-testid': 'active-photo' }, controller.activePhoto.value?.id ?? ''),
    ])
})

describe('PhotoGroup registration', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  // Catch a child replacing the group viewer or disabling its trigger, and warning on every update.
  it.each([
    ['Photo', Photo, 'figure'],
    ['PhotoAlbum', PhotoAlbum, '.np-album__item'],
    ['PhotoCarousel', PhotoCarousel, '.np-carousel__slide'],
  ] as const)(
    'ignores %s lightbox options with one group-owner warning',
    async (name, child, selector) => {
      const warn = vi.spyOn(console, 'warn')
      const childRender = vi.fn(() => null)
      const childViewer = defineComponent({ render: childRender })
      const photo = makePhoto({ id: 'owned' })
      const childProps = reactive({
        lightbox: { component: childViewer } as false | { component: typeof childViewer },
      })
      const mounted = await mountComponent(PhotoGroup, {
        props: { photos: [photo], lightbox: { component: ProbeLightbox, transition: 'none' } },
        slots: {
          default: () =>
            child === Photo
              ? h(Photo, { ...childProps, photo })
              : child === PhotoAlbum
                ? h(PhotoAlbum, { ...childProps, photos: [photo] })
                : h(PhotoCarousel, { ...childProps, photos: [photo] }),
        },
      })
      mounted.container.querySelector<HTMLElement>(selector)!.click()
      await flushUi()
      expect(childRender).not.toHaveBeenCalled()
      expect(mounted.container.querySelector('[data-testid="group-photos"]')?.textContent).toBe(
        'owned',
      )
      childProps.lightbox = false
      await flushUi()
      expect(mounted.container.querySelector(selector)?.getAttribute('role')).toBe('button')
      expect(
        warn.mock.calls.filter(([message]) =>
          String(message).includes(`${name} ignores its lightbox option because PhotoGroup owns`),
        ),
      ).toHaveLength(1)
      mounted.unmount()
    },
  )

  it('uses the explicit canonical collection regardless of descendant order', async () => {
    const first = makePhoto({ id: 'first' })
    const album = [makePhoto({ id: 'second' }), makePhoto({ id: 'third' })]
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [first, ...album], lightbox: { component: ProbeLightbox } },
      slots: {
        default: () => [h(PhotoAlbum, { photos: album }), h(Photo, { photo: first })],
      },
    })
    mounted.container.querySelector('figure')!.click()
    await flushUi()
    expect(mounted.container.querySelector('[data-testid="group-photos"]')?.textContent).toBe(
      'first,second,third',
    )
    mounted.unmount()
  })

  it('reacts to canonical reordering without remounting descendants', async () => {
    const first = makePhoto({ id: 'first' })
    const second = makePhoto({ id: 'second' })
    const props = reactive({
      photos: [first, second] as readonly PhotoItem[],
      lightbox: { component: ProbeLightbox },
    })
    const mounted = await mountComponent(PhotoGroup, {
      props,
      slots: {
        default: () => [h(Photo, { photo: first }), h(Photo, { photo: second })],
      },
    })
    mounted.container.querySelector('figure')!.click()
    await flushUi()

    props.photos = [second, first]
    await flushUi()
    expect(mounted.container.querySelector('[data-testid="group-photos"]')?.textContent).toBe(
      'second,first',
    )

    props.photos = [first]
    await flushUi()
    const figures = mounted.container.querySelectorAll('figure')
    expect(figures[0]?.getAttribute('role')).toBe('button')
    expect(figures[1]?.getAttribute('role')).toBeNull()

    figures[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushUi()
    expect(mounted.container.querySelector('[data-testid="active-photo"]')?.textContent).toBe(
      'first',
    )

    props.photos = [first, second]
    await flushUi()
    expect(figures[1]?.getAttribute('role')).toBe('button')

    mounted.unmount()
  })

  it('throws for duplicate ids in the canonical collection', async () => {
    const duplicate = makePhoto({ id: 'duplicate' })
    await expect(
      mountComponent(PhotoGroup, {
        props: {
          photos: [duplicate, { ...duplicate }],
          lightbox: { component: ProbeLightbox },
        },
        slots: {
          default: () => [h(Photo, { photo: duplicate }), h(PhotoAlbum, { photos: [duplicate] })],
        },
      }),
    ).rejects.toThrow(/share the id "duplicate"/)
  })

  it.each(['photo', 'album'])(
    'rejects a %s capability missing from the canonical collection',
    async (recipe) => {
      const canonical = makePhoto({ id: 'canonical' })
      const missing = makePhoto({ id: 'missing' })
      await expect(
        mountComponent(PhotoGroup, {
          props: { photos: [canonical], lightbox: { component: ProbeLightbox } },
          slots: {
            default: () =>
              recipe === 'photo'
                ? h(Photo, { photo: missing })
                : h(PhotoAlbum, { photos: [missing] }),
          },
        }),
      ).rejects.toThrow(
        /descendant photo "missing" is missing from the canonical photos collection/,
      )
    },
  )

  it('keeps the previous capability aggregate when replacement validation fails', async () => {
    const a = makePhoto({ id: 'a' })
    const b = makePhoto({ id: 'b' })
    let context: PhotoGroupContext | null = null
    const Capture = defineComponent(() => {
      context = inject(PhotoGroupContextKey) ?? null
      return () => null
    })
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [a, b], lightbox: { component: ProbeLightbox } },
      slots: { default: () => h(Capture) },
    })
    const first = Symbol('first')
    const second = Symbol('second')
    const third = Symbol('third')
    const capability = (id: string) => ({
      id,
      renderSlide: () => null,
    })

    context!.replaceCapabilities(first, [capability('a')])
    context!.replaceCapabilities(second, [capability('b')])
    expect(() => context!.replaceCapabilities(second, [capability('a')])).toThrow(
      /Multiple custom slide renderers.*"a"/,
    )
    expect(() => context!.replaceCapabilities(third, [capability('b')])).toThrow(
      /Multiple custom slide renderers.*"b"/,
    )

    mounted.unmount()
  })

  // Catch a child creating a lightbox of its own when the surrounding group turned it off.
  it('keeps descendants inert when mounted without a provider', async () => {
    const photo = makePhoto({ id: 'inert' })
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [photo], lightbox: false },
      slots: {
        default: () => [
          h(Photo, { photo, lightbox: true }),
          h(PhotoAlbum, { photos: [photo], lightbox: true }),
          h(PhotoCarousel, { photos: [photo], lightbox: true }),
        ],
      },
    })
    expect(mounted.container.querySelector('[role="button"]')).toBeNull()
    expect(document.querySelector('dialog')).toBeNull()
    mounted.unmount()
  })

  // Catch a grouped Photo reporting the group's open state for another photo, or its
  // v-model not reaching the group.
  it('drives the group from a child v-model and reports isOpen only for that photo', async () => {
    const photos = [makePhoto({ id: 'first' }), makePhoto({ id: 'second' })]
    const first = ref<GalleryHandle | null>(null)
    const second = ref<GalleryHandle | null>(null)
    const active = ref<string | null>(null)
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos, lightbox: { component: ProbeLightbox } },
      slots: {
        default: () => [
          h(Photo, { ref: first, photo: photos[0]! }),
          h(Photo, {
            ref: second,
            photo: photos[1]!,
            active: active.value,
            'onUpdate:active': (id: string | null) => (active.value = id),
          }),
        ],
      },
    })
    active.value = 'second'
    await flushUi()
    expect(mounted.container.querySelector('[data-testid="active-photo"]')?.textContent).toBe(
      'second',
    )
    expect(second.value!.isOpen).toBe(true)
    expect(first.value!.isOpen).toBe(false)

    await second.value!.close()
    await flushUi()
    expect(active.value).toBeNull()
    mounted.unmount()
  })

  // Catch a standalone recipe exposing a PhotoGroup to its slots, or losing useLightbox().
  it('gives standalone slots a lightbox context but no group', async () => {
    let group: unknown = 'unset'
    let ids = ''
    const Probe = defineComponent(() => {
      group = inject(PhotoGroupContextKey, null)
      ids = useLightbox()
        .photos.value.map((photo) => photo.id)
        .join(',')
      return () => null
    })
    const photos = [makePhoto({ id: 'solo-a' }), makePhoto({ id: 'solo-b' })]
    const mounted = await mountComponent(PhotoAlbum, {
      props: { photos },
      slots: { thumbnail: () => h(Probe) },
    })
    expect(group).toBeNull()
    expect(ids).toBe('solo-a,solo-b')
    mounted.unmount()
  })

  // Catch a slot controller that does nothing before the viewer has mounted, or whose
  // openById resolves before the lightbox is open.
  it('opens from a slot useLightbox() before the viewer has mounted', async () => {
    let controller: ReturnType<typeof useLightbox> | null = null
    const Probe = defineComponent(() => {
      controller = useLightbox()
      return () => null
    })
    const photos = [makePhoto({ id: 'lazy-a' }), makePhoto({ id: 'lazy-b' })]
    const mounted = await mountComponent(PhotoAlbum, {
      props: { photos, lightbox: { component: ProbeLightbox } },
      slots: { thumbnail: () => h(Probe) },
    })
    expect(mounted.container.querySelector('[data-testid="active-photo"]')).toBeNull()
    controller!.next()
    expect(controller!.isOpen.value).toBe(false)

    await controller!.openById('lazy-b')
    expect(controller!.isOpen.value).toBe(true)
    expect(controller!.activeId.value).toBe('lazy-b')
    expect(mounted.container.querySelector('[data-testid="active-photo"]')?.textContent).toBe(
      'lazy-b',
    )
    mounted.unmount()
  })

  // Catch the flight starting from, or the hidden state landing on, the first copy found
  // instead of the copy the visitor clicked.
  it('opens from and hides the activated copy of a photo shown twice', async () => {
    const photo = makePhoto({ id: 'twice' })
    const box = (left: number) =>
      ({
        left,
        top: 0,
        width: 200,
        height: 150,
        right: left + 200,
        bottom: 150,
        x: left,
        y: 0,
      }) as DOMRect
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
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [photo], lightbox: { transition: 'flip' } },
      slots: { default: () => [h(Photo, { photo }), h(Photo, { photo })] },
    })
    const [first, second] = mounted.container.querySelectorAll<HTMLElement>('figure')
    const firstRect = vi.fn(() => box(0))
    const secondRect = vi.fn(() => box(400))
    first!.getBoundingClientRect = firstRect
    second!.getBoundingClientRect = secondRect

    second!.click()
    await flushUi(12)

    expect(secondRect).toHaveBeenCalled()
    expect(firstRect).not.toHaveBeenCalled()
    expect(second!.style.opacity).toBe('0')
    mounted.unmount()
  })

  it('hides an equivalent same-id trigger during grouped transitions', async () => {
    const canonical = makePhoto({ id: 'same-id' })
    const descendant = { ...canonical }
    const context: PhotoGroupContext = {
      enabled: true,
      hasPhoto: () => true,
      hiddenId: computed(() => canonical.id),
      replaceCapabilities() {},
      removeCapabilities() {},
      async activate() {},
      async openById() {},
      async close() {},
      isOpen: computed(() => false),
      activeId: computed(() => null),
      activePhoto: computed(() => null),
    }
    const mounted = await mountComponent(Photo, {
      props: { photo: descendant },
      provideValues: [[PhotoGroupContextKey, context]],
    })

    expect((mounted.container.querySelector('figure') as HTMLElement).style.opacity).toBe('0')
    mounted.unmount()
  })
})
