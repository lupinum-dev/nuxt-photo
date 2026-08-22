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

  it('skips container-query CSS when defaultContainerWidth owns rendering', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'dcw-1' }), makePhoto({ id: 'dcw-2' })],
        lightbox: false,
        breakpoints: [400, 800],
        defaultContainerWidth: 800,
      },
    })

    // Inline widths are authoritative with dcw; emitting @container rules
    // alongside them would ship a stylesheet that can never apply.
    expect(mounted.container.querySelector('style')).toBeNull()

    const item = mounted.container.querySelector('.np-album__item') as HTMLElement
    expect(item.getAttribute('style')).toContain('calc(')
    expect(item.className).not.toContain('np-item-')

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
})
