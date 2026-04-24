// @vitest-environment jsdom

import { createApp, h } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LightboxProvider, LightboxRoot, PhotoTrigger } from '@nuxt-photo/vue'
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
    ).toThrow(
      /\[nuxt-photo\] `PhotoTrigger` requires an active lightbox context/,
    )
  })
})
