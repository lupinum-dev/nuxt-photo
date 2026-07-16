// @vitest-environment jsdom

import { computed, defineComponent, h, inject, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import type { PhotoItem } from '../../src/core/index'
import { useLightbox } from '../../src/composables'
import Photo from '../../src/components/Photo.vue'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
import {
  PhotoGroupContextKey,
  type PhotoGroupContext,
} from '../../src/components/photo-group/context'
import {
  flushUi,
  installBrowserStubs,
  mountComponent,
} from '../support/runtime'

const ProbeLightbox = defineComponent(() => {
  const controller = useLightbox()
  return () =>
    h(
      'output',
      { 'data-testid': 'group-photos' },
      controller.photos.value.map((photo) => photo.id).join(','),
    )
})

describe('PhotoGroup registration', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('uses the explicit canonical collection regardless of descendant order', async () => {
    const first = makePhoto({ id: 'first' })
    const album = [makePhoto({ id: 'second' }), makePhoto({ id: 'third' })]
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [first, ...album], lightbox: ProbeLightbox },
      slots: {
        default: () => [
          h(PhotoAlbum, { photos: album }),
          h(Photo, { photo: first }),
        ],
      },
    })
    await flushUi()
    expect(
      mounted.container.querySelector('[data-testid="group-photos"]')
        ?.textContent,
    ).toBe('first,second,third')
    mounted.unmount()
  })

  it('reacts to canonical reordering without remounting descendants', async () => {
    const first = makePhoto({ id: 'first' })
    const second = makePhoto({ id: 'second' })
    const props = reactive({
      photos: [first, second] as readonly PhotoItem[],
      lightbox: ProbeLightbox,
    })
    const mounted = await mountComponent(PhotoGroup, {
      props,
      slots: {
        default: () => [
          h(Photo, { photo: first }),
          h(Photo, { photo: second }),
        ],
      },
    })

    props.photos = [second, first]
    await flushUi()
    expect(
      mounted.container.querySelector('[data-testid="group-photos"]')
        ?.textContent,
    ).toBe('second,first')

    props.photos = [first]
    await flushUi()
    const figures = mounted.container.querySelectorAll('figure')
    expect(figures[0]?.getAttribute('role')).toBe('button')
    expect(figures[1]?.getAttribute('role')).toBeNull()

    mounted.unmount()
  })

  it('throws for duplicate ids in the canonical collection', async () => {
    const duplicate = makePhoto({ id: 'duplicate' })
    await expect(
      mountComponent(PhotoGroup, {
        props: {
          photos: [duplicate, { ...duplicate }],
          lightbox: ProbeLightbox,
        },
        slots: {
          default: () => [
            h(Photo, { photo: duplicate }),
            h(PhotoAlbum, { photos: [duplicate] }),
          ],
        },
      }),
    ).rejects.toThrow(/duplicate photo id "duplicate"/)
  })

  it.each(['photo', 'album'])(
    'rejects a %s capability missing from the canonical collection',
    async (recipe) => {
      const canonical = makePhoto({ id: 'canonical' })
      const missing = makePhoto({ id: 'missing' })
      await expect(
        mountComponent(PhotoGroup, {
          props: { photos: [canonical], lightbox: ProbeLightbox },
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
      props: { photos: [a, b], lightbox: ProbeLightbox },
      slots: { default: () => h(Capture) },
    })
    const first = Symbol('first')
    const second = Symbol('second')
    const third = Symbol('third')
    const capability = (id: string) => ({
      id,
      getThumbnailElement: () => null,
      renderSlide: () => null,
    })

    context!.replaceCapabilities(first, [capability('a')])
    context!.replaceCapabilities(second, [capability('b')])
    expect(() =>
      context!.replaceCapabilities(second, [capability('a')]),
    ).toThrow(/Multiple custom slide renderers.*"a"/)
    expect(() =>
      context!.replaceCapabilities(third, [capability('b')]),
    ).toThrow(/Multiple custom slide renderers.*"b"/)

    mounted.unmount()
  })

  it('keeps descendants inert when mounted without a provider', async () => {
    const mounted = await mountComponent(PhotoGroup, {
      props: { photos: [makePhoto({ id: 'inert' })], lightbox: false },
      slots: { default: () => h(Photo, { photo: makePhoto({ id: 'inert' }) }) },
    })
    expect(
      mounted.container.querySelector('figure')?.getAttribute('role'),
    ).toBeNull()
    expect(mounted.container.querySelector('[role="dialog"]')).toBeNull()
    mounted.unmount()
  })

  it('hides an equivalent same-id trigger during grouped transitions', async () => {
    const canonical = makePhoto({ id: 'same-id' })
    const descendant = { ...canonical }
    const context: PhotoGroupContext = {
      enabled: true,
      hasPhoto: () => true,
      photos: computed(() => [canonical]),
      hiddenPhoto: computed(() => canonical),
      replaceCapabilities() {},
      removeCapabilities() {},
      async open() {},
      async activateById() {},
    }
    const mounted = await mountComponent(Photo, {
      props: { photo: descendant },
      provideValues: [[PhotoGroupContextKey, context]],
    })

    expect(
      (mounted.container.querySelector('figure') as HTMLElement).style.opacity,
    ).toBe('0')
    mounted.unmount()
  })
})
