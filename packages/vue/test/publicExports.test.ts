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
        'responsive',
        'useLightbox',
        'usePhotoLabels',
      ].sort(),
    )
  })

  it('does not declare removed recipe and image props', () => {
    for (const component of [vue.Photo, vue.PhotoAlbum, vue.PhotoGroup, vue.PhotoCarousel]) {
      const props = Object.keys(Reflect.get(component, 'props'))
      for (const removed of [
        'loading',
        'transition',
        'navigation',
        'imgClass',
        'captionClass',
        'itemClass',
        'slideClass',
        'thumbClass',
        'controlsClass',
        'showArrows',
        'showThumbnails',
        'showCounter',
        'showDots',
      ]) {
        expect(props).not.toContain(removed)
      }
    }
    expect(Object.keys(Reflect.get(vue.PhotoImage, 'props'))).not.toContain('loading')
  })

  it('keeps validation errors public', () => {
    expect(new vue.PhotoValidationError('test', [])).toBeInstanceOf(vue.PhotoValidationError)
  })
})
