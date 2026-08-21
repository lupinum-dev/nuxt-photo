import { describe, expect, it } from 'vite-plus/test'
import * as app from '../src/runtime/app'
import {
  ImageAdapterKey,
  DEFAULT_PHOTO_LABELS,
  Lightbox,
  LightboxCaption,
  LightboxComponentKey,
  LightboxControls,
  LightboxDefaultsKey,
  PhotoLabelsKey,
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
  resolvePhotoLabels,
  resolveResponsiveParameter,
  useContainerWidth,
  useLightbox,
  provideLightbox,
  providePhotoLabels,
  usePhotoLabels,
} from '../src/runtime/app'
import type { LightboxCaptionSlotProps, PhotoItem } from '../src/runtime/app'

describe('@lupinum/nuxt-photo app exports', () => {
  it('exposes the documented app runtime API exactly', () => {
    expect(Object.keys(app).sort()).toEqual(
      [
        'ImageAdapterKey',
        'DEFAULT_PHOTO_LABELS',
        'Lightbox',
        'LightboxCaption',
        'LightboxComponentKey',
        'LightboxControls',
        'LightboxDefaultsKey',
        'PhotoLabelsKey',
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
        'resolvePhotoLabels',
        'useContainerWidth',
        'useLightbox',
        'provideLightbox',
        'providePhotoLabels',
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
    expect(provideLightbox).toBeTypeOf('function')
    expect(providePhotoLabels).toBeTypeOf('function')
    expect(usePhotoLabels).toBeTypeOf('function')
    expect(resolvePhotoLabels).toBeTypeOf('function')
    expect(DEFAULT_PHOTO_LABELS.close).toBe('Close')
    expect(useContainerWidth).toBeTypeOf('function')
    expect(ImageAdapterKey).toBeTypeOf('symbol')
    expect(LightboxComponentKey).toBeTypeOf('symbol')
    expect(LightboxDefaultsKey).toBeTypeOf('symbol')
    expect(PhotoLabelsKey).toBeTypeOf('symbol')
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
