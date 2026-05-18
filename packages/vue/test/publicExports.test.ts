import { describe, expect, it } from 'vitest'
import * as vue from '../src'

describe('@nuxt-photo/vue public exports', () => {
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
