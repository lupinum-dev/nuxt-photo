// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import { PhotoDefaultsKey } from '../src/provide/keys'
import { DEFAULT_PHOTO_LABELS, resolvePhotoLabels } from '../src/provide/labels'
import { flushUi, installBrowserStubs, mountComponent } from './support/runtime'

describe('photo labels', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('freezes English defaults and fills partial label sets', () => {
    expect(Object.isFrozen(DEFAULT_PHOTO_LABELS)).toBe(true)
    const labels = resolvePhotoLabels({ close: 'Schließen', viewPhoto: (i) => `Foto ${i}` })
    expect(labels.close).toBe('Schließen')
    expect(labels.viewPhoto(2)).toBe('Foto 2')
    expect(labels.previous).toBe(DEFAULT_PHOTO_LABELS.previous)
  })

  it('renders localized lightbox labels and announcements', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'l-1' }), makePhoto({ id: 'l-2' })],
        transition: 'none',
      },
      provideValues: [
        [
          PhotoDefaultsKey,
          {
            labels: {
              photoViewer: 'Bildbetrachter',
              previous: 'Zurück',
              next: 'Weiter',
              close: 'Schließen',
              slideStatus: (index: number, count: number) => `Bild ${index} von ${count}`,
            },
          },
        ],
      ],
    })

    ;(mounted.container.querySelector('[role="button"]') as HTMLElement).click()
    await flushUi()

    const dialog = document.body.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.getAttribute('aria-label')).toBe('Bildbetrachter')
    expect(dialog.textContent).toContain('Bild 1 von 2')
    expect(Array.from(dialog.querySelectorAll('button'), (button) => button.ariaLabel)).toEqual(
      expect.arrayContaining(['Zurück', 'Weiter', 'Schließen']),
    )

    mounted.unmount()
  })

  it('localizes the trigger fallback when alt text is absent', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: { photos: [makePhoto({ id: 'l-alt', alt: undefined })], lightbox: true },
      provideValues: [[PhotoDefaultsKey, { labels: { viewPhoto: (i: number) => `Foto ${i}` } }]],
    })

    expect(mounted.container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(
      'Foto 1',
    )
    mounted.unmount()
  })
})
