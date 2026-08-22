import { describe, expect, it } from 'vite-plus/test'
import { resolveNuxtPhotoLabels } from '../src/runtime/labels'

describe('Nuxt photo labels', () => {
  it('keeps static labels and expands indexed templates', () => {
    const labels = resolveNuxtPhotoLabels({
      close: 'Schliessen',
      goToSlide: 'Gehe zu Bild {index}',
      viewPhoto: 'Foto {index} ansehen',
      slideStatus: 'Bild {index} von {count}',
    })

    expect(labels.close).toBe('Schliessen')
    expect(labels.goToSlide?.(3)).toBe('Gehe zu Bild 3')
    expect(labels.viewPhoto?.(4)).toBe('Foto 4 ansehen')
    expect(labels.slideStatus?.(2, 8)).toBe('Bild 2 von 8')
  })

  it('expands every occurrence of a template placeholder', () => {
    const labels = resolveNuxtPhotoLabels({
      slideStatus: '{index}/{count}: item {index}',
    })

    expect(labels.slideStatus?.(5, 12)).toBe('5/12: item 5')
  })
})
