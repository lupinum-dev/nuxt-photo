// @vitest-environment jsdom

import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makePhoto } from '@test-fixtures/photos'
import { useLightbox } from '../../src/composables'
import Photo from '../../src/components/Photo.vue'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import PhotoGroup from '../../src/components/PhotoGroup.vue'
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

  it('collects descendant Photo and PhotoAlbum entries in render order', async () => {
    const first = makePhoto({ id: 'first' })
    const album = [makePhoto({ id: 'second' }), makePhoto({ id: 'third' })]
    const mounted = await mountComponent(PhotoGroup, {
      props: { lightbox: ProbeLightbox },
      slots: {
        default: () => [
          h(Photo, { photo: first }),
          h(PhotoAlbum, { photos: album }),
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

  it('throws for duplicate ids registered by separate children', async () => {
    const duplicate = makePhoto({ id: 'duplicate' })
    await expect(
      mountComponent(PhotoGroup, {
        props: { lightbox: ProbeLightbox },
        slots: {
          default: () => [
            h(Photo, { photo: duplicate }),
            h(PhotoAlbum, { photos: [{ ...duplicate }] }),
          ],
        },
      }),
    ).rejects.toThrow(/duplicate photo id "duplicate"/)
  })

  it('keeps descendants inert when mounted without a provider', async () => {
    const mounted = await mountComponent(PhotoGroup, {
      props: { lightbox: false },
      slots: { default: () => h(Photo, { photo: makePhoto({ id: 'inert' }) }) },
    })
    expect(
      mounted.container.querySelector('figure')?.getAttribute('role'),
    ).toBeNull()
    expect(mounted.container.querySelector('[role="dialog"]')).toBeNull()
    mounted.unmount()
  })
})
