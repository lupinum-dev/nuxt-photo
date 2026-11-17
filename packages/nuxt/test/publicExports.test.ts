import { describe, expect, it } from 'vite-plus/test'
import type { PhotoItem } from '../src/runtime/app'
import type { LightboxCaptionSlotProps } from '../src/runtime/primitives'
// Static imports: the module graph loads before the tests, outside their timeout.
import * as moduleEntry from '../src/module'
import * as primitivesEntry from '../src/runtime/primitives'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exports only the module from the package root', () => {
    expect(Object.keys(moduleEntry).sort()).toEqual(['default'])
  })

  // The real-Nuxt integration test checks that the app entry no longer carries these.
  it('exposes the lightbox primitives from their own entry', () => {
    expect(Object.keys(primitivesEntry).sort()).toEqual([
      'LightboxAmbient',
      'LightboxCaption',
      'LightboxControls',
      'LightboxOverlay',
      'LightboxProvider',
      'LightboxRoot',
      'LightboxSlide',
      'LightboxViewport',
      'PhotoTrigger',
    ])
  })

  it('keeps consumer-proven Nuxt app types available', () => {
    const photo = {
      id: 'consumer-photo',
      src: '/photo.jpg',
      width: 1200,
      height: 800,
      description: 'Used by custom caption UIs',
    } satisfies PhotoItem & { id: string }

    const captionPhoto: LightboxCaptionSlotProps['photo'] = photo

    expect(captionPhoto?.description).toBe('Used by custom caption UIs')
  })
})
