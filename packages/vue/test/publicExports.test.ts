import { describe, expect, it } from 'vite-plus/test'
import * as vue from '../src'

describe('@lupinum/vue-photo public exports', () => {
  it('exposes the documented root runtime API exactly', () => {
    expect(Object.keys(vue).sort()).toEqual(
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
        'measureImage',
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

  it('keeps app-level extension keys public', () => {
    expect(vue.ImageAdapterKey).toBeTypeOf('symbol')
    expect(vue.LightboxComponentKey).toBeTypeOf('symbol')
    expect(vue.LightboxDefaultsKey).toBeTypeOf('symbol')
    expect(new vue.PhotoValidationError('test', [])).toBeInstanceOf(vue.PhotoValidationError)
  })
})
