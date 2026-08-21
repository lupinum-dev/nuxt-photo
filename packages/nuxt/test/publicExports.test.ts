import { describe, expect, it } from 'vite-plus/test'
import * as app from '../src/runtime/app'
import {
  ImageAdapterKey,
  Lightbox,
  LightboxCaption,
  LightboxComponentKey,
  LightboxControls,
  PhotoDefaultsKey,
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
  usePhotoLabels,
  provideLightbox,
} from '../src/runtime/app'
import type { LightboxCaptionSlotProps, PhotoItem } from '../src/runtime/app'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exposes the documented app runtime API exactly', () => {
    expect(Object.keys(app).sort()).toEqual(
      [
        'ImageAdapterKey',
        'Lightbox',
        'LightboxCaption',
        'LightboxComponentKey',
        'LightboxControls',
        'PhotoDefaultsKey',
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
        'resolveResponsiveParameter',
        'responsive',
        'useContainerWidth',
        'useLightbox',
        'usePhotoLabels',
        'provideLightbox',
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
    expect(usePhotoLabels).toBeTypeOf('function')
    expect(provideLightbox).toBeTypeOf('function')
    expect(useContainerWidth).toBeTypeOf('function')
    expect(ImageAdapterKey).toBeTypeOf('symbol')
    expect(LightboxComponentKey).toBeTypeOf('symbol')
    expect(PhotoDefaultsKey).toBeTypeOf('symbol')
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
