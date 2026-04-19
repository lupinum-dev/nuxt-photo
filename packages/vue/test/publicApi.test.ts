import { describe, expect, it } from 'vitest'
import * as api from '@nuxt-photo/vue'
import * as extendApi from '@nuxt-photo/vue/extend'

describe('@nuxt-photo/vue public API', () => {
  it('exports the intended lightbox controller and primitives', () => {
    expect(api).toHaveProperty('useLightbox')
    expect(api).toHaveProperty('LightboxRoot')
    expect(api).toHaveProperty('LightboxSlide')
    expect(api).toHaveProperty('PhotoImage')
  })

  it('exports AlbumLayout types', () => {
    // Type re-exports are erased at runtime, but the module should not throw on import
    // and should include the responsive helper
    expect(api).toHaveProperty('responsive')
    expect(api).toHaveProperty('resolveResponsiveParameter')
  })

  it('does not expose internal lightbox engine symbols from the root entrypoint', () => {
    expect(api).not.toHaveProperty('useLightboxContext')
    expect(api).not.toHaveProperty('useLightboxInject')
    expect(api).not.toHaveProperty('provideLightboxContexts')
    expect(api).not.toHaveProperty('LightboxControllerKey')
    expect(api).not.toHaveProperty('LightboxContextKey')
    expect(api).not.toHaveProperty('LightboxComponentKey')
    expect(api).not.toHaveProperty('LightboxDefaultsKey')
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

describe('@nuxt-photo/vue/extend API', () => {
  it('exports the extension composables and keys', () => {
    expect(extendApi).toHaveProperty('useLightboxContext')
    expect(extendApi).toHaveProperty('useLightboxInject')
    expect(extendApi).toHaveProperty('provideLightboxContexts')
    expect(extendApi).toHaveProperty('LightboxContextKey')
    expect(extendApi).toHaveProperty('LightboxSlideRendererKey')
    expect(extendApi).toHaveProperty('ImageAdapterKey')
    expect(extendApi).toHaveProperty('PhotoGroupContextKey')
    expect(extendApi).toHaveProperty('LightboxComponentKey')
    expect(extendApi).toHaveProperty('LightboxSlotsKey')
    expect(extendApi).toHaveProperty('LightboxDefaultsKey')
  })

  it('does not export deprecated individual keys', () => {
    expect(extendApi).not.toHaveProperty('LightboxControllerKey')
    expect(extendApi).not.toHaveProperty('LightboxChromeKey')
    expect(extendApi).not.toHaveProperty('LightboxOverlayKey')
    expect(extendApi).not.toHaveProperty('LightboxPortalKey')
    expect(extendApi).not.toHaveProperty('LightboxTriggerKey')
    expect(extendApi).not.toHaveProperty('LightboxStageKey')
    expect(extendApi).not.toHaveProperty('LightboxSlidesKey')
    expect(extendApi).not.toHaveProperty('LightboxCaptionKey')
  })
})
