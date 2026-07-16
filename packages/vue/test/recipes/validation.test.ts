// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import { PhotoValidationError } from '../../src/core/photo/normalize'
import { installBrowserStubs, mountComponent } from '../support/runtime'

describe('recipe validation', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('rejects invalid data before layout math', async () => {
    await expect(
      mountComponent(PhotoAlbum, {
        props: {
          photos: [{ id: 'broken', src: '/x.jpg', width: 0, height: 10 }],
          lightbox: false,
        },
      }),
    ).rejects.toBeInstanceOf(PhotoValidationError)
  })

  it('drops every invalid entry and reports the same structured issues', async () => {
    const onInvalidPhotos = vi.fn()
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'valid' }), null, { id: 'bad', src: '', width: 10, height: 10 }],
        validation: 'drop',
        onInvalidPhotos,
        lightbox: false,
      },
    })
    expect(mounted.container.querySelectorAll('img')).toHaveLength(1)
    expect(onInvalidPhotos).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: 'PhotoAlbum',
        issues: expect.arrayContaining([
          expect.objectContaining({ code: 'invalid-item' }),
          expect.objectContaining({ code: 'missing-src' }),
        ]),
      }),
    )
    mounted.unmount()
  })
})
