import { describe, expect, it } from 'vite-plus/test'
import type { LightboxCaptionSlotProps, PhotoItem } from '../src/runtime/app'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exports only the module from the package root', async () => {
    expect(Object.keys(await import('../src/module')).sort()).toEqual(['default'])
  })

  it('keeps consumer-proven Nuxt app types available', () => {
    const photo = {
      id: 'consumer-photo',
      src: '/photo.jpg',
      width: 1200,
      height: 800,
      description: 'Used by custom caption UIs',
    } satisfies PhotoItem

    const captionPhoto: LightboxCaptionSlotProps['photo'] = photo

    expect(captionPhoto.description).toBe('Used by custom caption UIs')
  })
})
