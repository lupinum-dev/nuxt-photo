import { describe, expect, it } from 'vite-plus/test'
import * as app from '../src/runtime/app'
import {
  ImageAdapterKey,
  Lightbox,
  LightboxCaption,
  LightboxComponentKey,
  LightboxControls,
  LightboxDefaultsKey,
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
  resolveResponsiveParameter,
  useContainerWidth,
  useLightbox,
  useLightboxProvider,
} from '../src/runtime/app'
import type { LightboxCaptionSlotProps, PhotoItem } from '../src/runtime/app'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exposes the documented app runtime API exactly', () => {
    expect(Object.keys(app).sort()).toEqual(
      [
        'DEFAULT_PHOTO_LABELS',
        'ImageAdapterKey',
        'Lightbox',
        'LightboxCaption',
        'LightboxComponentKey',
        'LightboxControls',
        'LightboxDefaultsKey',
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
        'resolvePhotoLabels',
        'resolveResponsiveParameter',
        'responsive',
        'useContainerWidth',
        'useLightbox',
        'useLightboxProvider',
        'usePhotoLabels',
      ].sort(),
    )
  })

  it('exposes the Nuxt app-facing API from one package', () => {
    expect(responsive({ 0: 1 })(320)).toBe(1)
    expect(resolveResponsiveParameter(undefined, 320, 2)).toBe(2)
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
    expect(useLightboxProvider).toBeTypeOf('function')
    expect(useContainerWidth).toBeTypeOf('function')
    expect(ImageAdapterKey).toBeTypeOf('symbol')
    expect(LightboxComponentKey).toBeTypeOf('symbol')
    expect(LightboxDefaultsKey).toBeTypeOf('symbol')
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
