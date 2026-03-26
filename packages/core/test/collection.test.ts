import { describe, expect, it } from 'vitest'
import { createCollection } from '@nuxt-photo/core'

describe('collection contract', () => {
  it('supports lookup, wraparound navigation, and preload candidates', () => {
    const collection = createCollection([
      { id: 'a' },
      { id: 'b' },
      { id: 'c' },
      { id: 'd' },
    ])

    expect(collection.getById('c')).toEqual({ id: 'c' })
    expect(collection.indexOfId('b')).toBe(1)
    expect(collection.next(3)).toBe(0)
    expect(collection.prev(0)).toBe(3)
    expect(collection.preloadCandidates(1, 2)).toEqual([
      { id: 'c' },
      { id: 'a' },
      { id: 'd' },
    ])
  })
})
