// @vitest-environment jsdom

import { createApp, defineComponent, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxProvider,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
  PhotoTrigger,
  useLightboxProvider,
} from '@nuxt-photo/vue'
import { makePhoto } from '@test-fixtures/photos'

function mountExpectingError(component: any, props?: Record<string, unknown>) {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp({
    render: () => h(component, props ?? {}),
  })

  let captured: unknown = null
  app.config.errorHandler = (error) => {
    captured ??= error
  }

  app.mount(container)
  app.unmount()
  container.remove()

  if (captured instanceof Error) {
    throw captured
  }

  if (captured) {
    throw new Error(String(captured))
  }
}

describe('primitive injection guards', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('throws an actionable error when LightboxRoot is used without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => mountExpectingError(LightboxRoot)).toThrow(
      /\[nuxt-photo\] `LightboxRoot` requires an active lightbox context/,
    )
  })

  it('provides lightbox context from LightboxProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      mountExpectingError(LightboxProvider, {
        photos: [makePhoto({ id: 'root-provider' })],
      }),
    ).not.toThrow()
  })

  it('throws an actionable error when PhotoTrigger is used without a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() =>
      mountExpectingError(PhotoTrigger, {
        photo: makePhoto({ id: 'guarded-trigger' }),
        index: 0,
      }),
    ).toThrow(/\[nuxt-photo\] `PhotoTrigger` requires an active lightbox context/)
  })

  it('supports every lightbox primitive from the single internal context', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const photos = [makePhoto({ id: 'primitive-all' })]

    const App = defineComponent({
      setup() {
        useLightboxProvider(photos, { transition: 'none' })
        return () =>
          h('div', [
            h(LightboxRoot),
            h(LightboxOverlay),
            h(LightboxControls, null, { default: () => null }),
            h(LightboxCaption, null, { default: () => null }),
            h(LightboxViewport, null, { default: () => null }),
            h(LightboxSlide, { photo: photos[0], index: 0 }),
            h(PhotoTrigger, { photo: photos[0], index: 0 }),
          ])
      },
    })

    expect(() => mountExpectingError(App)).not.toThrow()
  })
})
