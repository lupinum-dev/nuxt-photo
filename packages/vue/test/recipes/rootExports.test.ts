import { describe, expect, it } from 'vitest'
import { responsive } from '../../src'

describe('@nuxt-photo/vue root exports', () => {
  it('re-exports responsive for recipe-level album props', () => {
    const columns = responsive({ 0: 2, 768: 3 })

    expect(columns(320)).toBe(2)
    expect(columns(900)).toBe(3)
  })
})
