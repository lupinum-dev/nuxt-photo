import { describe, expect, it } from 'vite-plus/test'
import * as app from '../src/runtime/app'
import {
  Lightbox,
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxProvider,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
  Photo,
  PhotoAlbum,
  PhotoCarousel,
  PhotoGroup,
  PhotoImage,
  PhotoTrigger,
  PhotoValidationError,
  responsive,
  useLightbox,
  usePhotoLabels,
} from '../src/runtime/app'
import type { LightboxCaptionSlotProps, PhotoItem } from '../src/runtime/app'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exports only the module from the package root', async () => {
    expect(Object.keys(await import('../src/module')).sort()).toEqual(['default'])
  })

  it('exposes the documented app runtime API exactly', () => {
    expect(Object.keys(app).sort()).toEqual(
      [
        'Lightbox',
        'LightboxAmbient',
        'LightboxCaption',
        'LightboxControls',
        'LightboxOverlay',
        'LightboxProvider',
        'LightboxRoot',
        'LightboxSlide',
        'LightboxViewport',
        'Photo',
        'PhotoAlbum',
        'PhotoCarousel',
        'PhotoGroup',
        'PhotoImage',
        'PhotoTrigger',
        'PhotoValidationError',
        'createPhoto',
        'definePhotoProvider',
        'validatePhotos',
        'responsive',
        'useLightbox',
        'usePhotoLabels',
      ].sort(),
    )
  })

  it('exposes the Nuxt app-facing API from one package', () => {
    expect(responsive({ 0: 1 })(320)).toBe(1)
    expect(Photo).toBeTypeOf('object')
    expect(PhotoAlbum).toBeTypeOf('object')
    expect(PhotoCarousel).toBeTypeOf('object')
    expect(PhotoGroup).toBeTypeOf('object')
    expect(Lightbox).toBeTypeOf('object')
    expect(LightboxCaption).toBeTypeOf('object')
    expect(LightboxControls).toBeTypeOf('object')
    expect(LightboxOverlay).toBeTypeOf('object')
    expect(LightboxProvider).toBeTypeOf('object')
    expect(LightboxRoot).toBeTypeOf('object')
    expect(LightboxSlide).toBeTypeOf('object')
    expect(LightboxViewport).toBeTypeOf('object')
    expect(PhotoImage).toBeTypeOf('object')
    expect(PhotoTrigger).toBeTypeOf('object')
    expect(PhotoValidationError).toBeTypeOf('function')
    expect(useLightbox).toBeTypeOf('function')
    expect(usePhotoLabels).toBeTypeOf('function')
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
