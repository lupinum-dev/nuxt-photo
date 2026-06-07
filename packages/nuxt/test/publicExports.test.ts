import { describe, expect, it } from 'vitest'
import {
  ImageAdapterKey,
  Lightbox,
  LightboxComponentKey,
  LightboxRoot,
  PhotoAlbum,
  responsive,
  useLightbox,
} from '../src/runtime/app'

describe('@nuxt-photo/nuxt app exports', () => {
  it('exposes the Nuxt app-facing API from one package', () => {
    expect(responsive({ 0: 1 })(320)).toBe(1)
    expect(PhotoAlbum).toBeTypeOf('object')
    expect(Lightbox).toBeTypeOf('object')
    expect(LightboxRoot).toBeTypeOf('object')
    expect(useLightbox).toBeTypeOf('function')
    expect(ImageAdapterKey).toBeTypeOf('symbol')
    expect(LightboxComponentKey).toBeTypeOf('symbol')
  })
})
