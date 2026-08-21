// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoImage from '../src/primitives/PhotoImage.vue'
import { LightboxDefaultsKey } from '../src/provide/keys'
import { DEFAULT_PHOTO_LABELS, resolvePhotoLabels } from '../src/provide/labels'
import { flushUi, installBrowserStubs, mountComponent } from './support/runtime'

describe('photo labels', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('merges partial user labels over English defaults', () => {
    const labels = resolvePhotoLabels({ close: 'Schließen', viewPhoto: (i) => `Foto ${i}` })
    expect(labels.close).toBe('Schließen')
    expect(labels.viewPhoto(2)).toBe('Foto 2')
    expect(labels.previous).toBe(DEFAULT_PHOTO_LABELS.previous)
  })

  it('returns the shared defaults object when nothing is overridden', () => {
    expect(resolvePhotoLabels()).toBe(DEFAULT_PHOTO_LABELS)
    expect(resolvePhotoLabels({})).not.toBe(DEFAULT_PHOTO_LABELS)
    expect(resolvePhotoLabels({}).close).toBe(DEFAULT_PHOTO_LABELS.close)
  })

  it('renders localized lightbox aria labels from provided defaults', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'l-1' }), makePhoto({ id: 'l-2' })],
        transition: 'none',
      },
      provideValues: [
        [
          LightboxDefaultsKey,
          {
            labels: {
              photoViewer: 'Bildbetrachter',
              previous: 'Zurück',
              next: 'Weiter',
              zoom: 'Vergrößern',
              fit: 'Einpassen',
              close: 'Schließen',
            },
          },
        ],
      ],
    })

    const trigger = mounted.container.querySelector('[role="button"]') as HTMLElement
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushUi()

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog).not.toBeNull()
    expect(dialog.getAttribute('aria-label')).toBe('Bildbetrachter')

    const labels = Array.from(dialog.querySelectorAll('button')).map((button) =>
      button.getAttribute('aria-label'),
    )
    expect(labels).toContain('Zurück')
    expect(labels).toContain('Weiter')
    expect(labels).toContain('Schließen')

    mounted.unmount()
  })

  it('localizes album trigger fallback labels via viewPhoto', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'l-alt', alt: undefined })],
        transition: 'none',
      },
      provideValues: [[LightboxDefaultsKey, { labels: { viewPhoto: (i) => `Foto ${i}` } }]],
    })

    const trigger = mounted.container.querySelector('[role="button"]') as HTMLElement
    expect(trigger?.getAttribute('aria-label')).toBe('Foto 1')

    mounted.unmount()
  })
})

describe('placeholder backdrop', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('paints the placeholder behind the image until it loads', async () => {
    const mounted = await mountComponent(PhotoImage, {
      props: {
        photo: makePhoto({
          id: 'ph',
          placeholder: 'data:image/jpeg;base64,tiny',
        }),
      },
    })

    const img = mounted.container.querySelector('img') as HTMLImageElement
    expect(img.style.backgroundImage).toContain('data:image/jpeg;base64,tiny')
    expect(img.style.backgroundSize).toBe('cover')

    img.dispatchEvent(new Event('load'))
    await flushUi()
    expect(img.style.backgroundImage).toBe('')

    mounted.unmount()
  })

  it('applies no placeholder style without a placeholder field', async () => {
    const mounted = await mountComponent(PhotoImage, {
      props: { photo: makePhoto({ id: 'no-ph' }) },
    })

    const img = mounted.container.querySelector('img') as HTMLImageElement
    expect(img.style.backgroundImage).toBe('')

    mounted.unmount()
  })

  it('keeps reporting natural dimensions for CLS safety', async () => {
    const mounted = await mountComponent(PhotoImage, {
      props: {
        photo: makePhoto({ id: 'dims', width: 1600, height: 1000 }),
      },
    })

    const img = mounted.container.querySelector('img') as HTMLImageElement
    expect(img.getAttribute('width')).toBe('1600')
    expect(img.getAttribute('height')).toBe('1000')

    mounted.unmount()
  })
})
