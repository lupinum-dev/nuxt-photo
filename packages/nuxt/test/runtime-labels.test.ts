import { describe, expect, it } from 'vite-plus/test'
import { resolveNuxtPhotoLabels } from '../src/runtime/labels'

describe('Nuxt AppConfig labels', () => {
  it('keeps static labels serializable', () => {
    expect(resolveNuxtPhotoLabels({ close: 'Schließen', next: 'Weiter' })).toMatchObject({
      close: 'Schließen',
      next: 'Weiter',
    })
  })

  it('turns indexed templates into Vue label functions', () => {
    const labels = resolveNuxtPhotoLabels({
      counter: 'Bild {index} von {count}',
      goToSlide: 'Zu Bild {index}',
      viewPhoto: 'Bild {index} öffnen',
    })

    expect(labels?.counter?.(2, 8)).toBe('Bild 2 von 8')
    expect(labels?.goToSlide?.(3)).toBe('Zu Bild 3')
    expect(labels?.viewPhoto?.(4)).toBe('Bild 4 öffnen')
  })

  it('leaves omitted labels available for Vue defaults', () => {
    expect(resolveNuxtPhotoLabels()).toBeUndefined()
    expect(resolveNuxtPhotoLabels({ close: 'Close it' })).not.toHaveProperty('next')
  })
})
