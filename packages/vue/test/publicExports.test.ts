import { describe, expect, it } from 'vite-plus/test'
import * as vue from '../src'
import * as primitives from '../src/primitives'

describe('@lupinum/vue-photo public exports', () => {
  it('exposes the documented root runtime API exactly', () => {
    expect(Object.keys(vue).sort()).toEqual(
      [
        'Lightbox',
        'Photo',
        'PhotoAlbum',
        'PhotoCarousel',
        'PhotoGroup',
        'PhotoImage',
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

  it('exposes the lightbox primitives from their own entry', () => {
    expect(Object.keys(primitives).sort()).toEqual(
      [
        'LightboxAmbient',
        'LightboxCaption',
        'LightboxControls',
        'LightboxOverlay',
        'LightboxProvider',
        'LightboxRoot',
        'LightboxSlide',
        'LightboxViewport',
        'PhotoTrigger',
      ].sort(),
    )
  })
})
