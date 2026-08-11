// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../../src/components/PhotoAlbum.vue'
import { installBrowserStubs, mountComponent } from '../support/runtime'

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
})
