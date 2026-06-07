import { describe, expect, it } from 'vitest'
import * as vue from '../src'

describe('@nuxt-photo/vue public exports', () => {
  it('exposes high-level components from the root entry', () => {
    expect(vue.Photo).toBeTypeOf('object')
    expect(vue.PhotoAlbum).toBeTypeOf('object')
    expect(vue.PhotoCarousel).toBeTypeOf('object')
    expect(vue.Lightbox).toBeTypeOf('object')
  })

  it('does not expose recipe-owned PhotoGroup internals from the root entry', () => {
    expect('PhotoGroupContextKey' in vue).toBe(false)
    expect('PhotoGroupContext' in vue).toBe(false)
  })

  it('keeps app-level extension keys public', () => {
    expect(vue.ImageAdapterKey).toBeTypeOf('symbol')
    expect(vue.LightboxComponentKey).toBeTypeOf('symbol')
    expect(vue.LightboxDefaultsKey).toBeTypeOf('symbol')
  })
})
