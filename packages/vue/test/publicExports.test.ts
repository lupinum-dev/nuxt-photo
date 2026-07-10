import { describe, expect, it } from 'vitest'
import * as vue from '../src'

describe('@nuxt-photo/vue public exports', () => {
  it('exposes the documented root runtime API exactly', () => {
    expect(Object.keys(vue).sort()).toEqual(
      [
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
        'resolveResponsiveParameter',
        'responsive',
        'useContainerWidth',
        'useLightbox',
        'useLightboxProvider',
      ].sort(),
    )
  })

  it('does not expose internal implementation helpers from the root entry', () => {
    for (const name of [
      'PhotoGroupContextKey',
      'PhotoGroupContext',
      'computeRowsLayout',
      'computeColumnsLayout',
      'computeMasonryLayout',
      'computeZoomLevels',
      'loadImage',
      'chooseCloseTransition',
      'DEFAULT_MIN_ZOOM',
    ]) {
      expect(name in vue, name).toBe(false)
    }
  })

  it('keeps app-level extension keys public', () => {
    expect(vue.ImageAdapterKey).toBeTypeOf('symbol')
    expect(vue.LightboxComponentKey).toBeTypeOf('symbol')
    expect(vue.LightboxDefaultsKey).toBeTypeOf('symbol')
    expect(new vue.PhotoValidationError('test', [])).toBeInstanceOf(
      vue.PhotoValidationError,
    )
  })
})
