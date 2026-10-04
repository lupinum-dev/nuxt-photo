// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { makePhoto } from '@test-fixtures/photos'
import PhotoAlbum from '../src/components/PhotoAlbum.vue'
import PhotoCarousel from '../src/components/PhotoCarousel.vue'
import { createPhoto, usePhotoLabels, type PhotoLabels } from '../src'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { DEFAULT_PHOTO_LABELS } from '../src/provide/labels'
import { flushUi, installBrowserStubs, mountComponent } from './support/runtime'

describe('photo labels', () => {
  beforeEach(installBrowserStubs)
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('freezes English defaults and fills partial label sets', async () => {
    const labelsFor = async (partial: Partial<PhotoLabels>) => {
      const captured: PhotoLabels[] = []
      const app = createSSRApp({
        setup() {
          captured.push(usePhotoLabels())
          return () => null
        },
      })
      app.use(createPhoto({ labels: partial }))
      await renderToString(app)
      expect(captured).toHaveLength(1)
      return captured[0]!
    }
    expect(Object.isFrozen(DEFAULT_PHOTO_LABELS)).toBe(true)
    const labels = await labelsFor({ close: 'Schließen', viewPhoto: (i) => `Foto ${i}` })
    expect(labels.close).toBe('Schließen')
    expect(labels.viewPhoto(2)).toBe('Foto 2')
    expect(labels.previous).toBe(DEFAULT_PHOTO_LABELS.previous)

    const fallback = await labelsFor({ close: undefined })
    expect(fallback.close).toBe(DEFAULT_PHOTO_LABELS.close)
  })

  it('renders localized lightbox labels and announcements', async () => {
    const mounted = await mountComponent(PhotoAlbum, {
      props: {
        photos: [makePhoto({ id: 'l-1' }), makePhoto({ id: 'l-2' })],
        lightbox: { transition: 'none' },
      },
      plugins: [
        createPhoto({
          labels: {
            photoViewer: 'Bildbetrachter',
            previous: 'Zurück',
            next: 'Weiter',
            close: 'Schließen',
            slideStatus: (index: number, count: number) => `Bild ${index} von ${count}`,
          },
        }),
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
      plugins: [createPhoto({ labels: { viewPhoto: (i: number) => `Foto ${i}` } })],
    })

    expect(mounted.container.querySelector('[role="button"]')?.getAttribute('aria-label')).toBe(
      'Foto 1',
    )
    mounted.unmount()
  })

  it('localizes carousel lightbox triggers', async () => {
    const mounted = await mountComponent(PhotoCarousel, {
      props: {
        photos: [makePhoto({ id: 'carousel-label', alt: undefined })],
        lightbox: true,
      },
      plugins: [createPhoto({ labels: { viewPhoto: (i: number) => `Foto ${i}` } })],
    })

    expect(mounted.container.querySelector('.np-carousel__slide')?.getAttribute('aria-label')).toBe(
      'Foto 1',
    )
    mounted.unmount()
  })
})
