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

  it('does not emit dead container-query CSS when inline widths own rendering', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'one' }), makePhoto({ id: 'two' })],
        lightbox: false,
        breakpoints: [400, 800],
        defaultContainerWidth: 800,
      },
    })

    expect(mounted.container.querySelector('style')).toBeNull()
    expect(mounted.container.querySelector('.np-album__item')?.getAttribute('style')).toContain(
      'calc(',
    )
    mounted.unmount()
  })
})
