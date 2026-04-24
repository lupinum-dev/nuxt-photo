import { describe, expect, it } from 'vitest'
import * as api from '@nuxt-photo/vue'

describe('@nuxt-photo/vue public API', () => {
  it('exports the intended lightbox controller and primitives', () => {
    expect(api).toHaveProperty('useLightbox')
    expect(api).toHaveProperty('LightboxProvider')
    expect(api).toHaveProperty('LightboxRoot')
    expect(api).toHaveProperty('LightboxSlide')
    expect(api).toHaveProperty('PhotoImage')
  })

  it('exports the stable provider and injection surface', () => {
    expect(api).toHaveProperty('useLightboxProvider')
    expect(api).toHaveProperty('LightboxComponentKey')
    expect(api).toHaveProperty('PhotoGroupContextKey')
    expect(api).toHaveProperty('ImageAdapterKey')
    expect(api).toHaveProperty('LightboxDefaultsKey')
  })

  it('exports AlbumLayout helpers', () => {
    // Type re-exports are erased at runtime, but the module should not throw on import
    // and should include the responsive helper
    expect(api).toHaveProperty('responsive')
    expect(api).toHaveProperty('resolveResponsiveParameter')
  })

  it('does not expose internal engine implementation helpers from the root entrypoint', () => {
    expect(api).not.toHaveProperty('useLightboxContext')
    expect(api).not.toHaveProperty('useLightboxInject')
    expect(api).not.toHaveProperty('provideLightboxContexts')
    expect(api).not.toHaveProperty('LightboxControllerKey')
    expect(api).not.toHaveProperty('LightboxContextKey')
    expect(api).not.toHaveProperty('LightboxSlideRendererKey')
    expect(api).not.toHaveProperty('useCarousel')
    expect(api).not.toHaveProperty('usePanzoom')
    expect(api).not.toHaveProperty('useGestures')
    expect(api).not.toHaveProperty('useGhostTransition')
    expect(api).not.toHaveProperty('createTransitionMode')
    expect(api).not.toHaveProperty('createDebug')
  })
})
