import { describe, expect, it } from 'vitest'
import * as api from '@nuxt-photo/vue'

describe('@nuxt-photo/vue public API', () => {
  it('exports the intended lightbox controller and primitives', () => {
    expect(api).toHaveProperty('useLightbox')
    expect(api).toHaveProperty('LightboxRoot')
    expect(api).toHaveProperty('LightboxSlide')
    expect(api).toHaveProperty('PhotoImage')
  })

  it('does not expose internal lightbox engine symbols from the root entrypoint', () => {
    expect(api).not.toHaveProperty('useLightboxContext')
    expect(api).not.toHaveProperty('provideLightboxContexts')
    expect(api).not.toHaveProperty('LightboxControllerKey')
    expect(api).not.toHaveProperty('PhotoGroupContextKey')
    expect(api).not.toHaveProperty('ImageAdapterKey')
    expect(api).not.toHaveProperty('useCarousel')
    expect(api).not.toHaveProperty('usePanzoom')
    expect(api).not.toHaveProperty('useGestures')
    expect(api).not.toHaveProperty('useGhostTransition')
    expect(api).not.toHaveProperty('createTransitionMode')
    expect(api).not.toHaveProperty('createDebug')
  })
})
