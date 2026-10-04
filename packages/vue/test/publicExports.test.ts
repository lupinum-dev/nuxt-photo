import { describe, expect, it } from 'vite-plus/test'
import * as vue from '../src'

describe('@lupinum/vue-photo public exports', () => {
  it('exposes the documented root runtime API exactly', () => {
    expect(Object.keys(vue).sort()).toEqual(
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
        'resolveResponsiveParameter',
        'responsive',
        'useContainerWidth',
        'useLightbox',
        'usePhotoLabels',
        'provideLightbox',
      ].sort(),
    )
  })

  it('keeps validation errors public', () => {
    expect(new vue.PhotoValidationError('test', [])).toBeInstanceOf(vue.PhotoValidationError)
  })
})
