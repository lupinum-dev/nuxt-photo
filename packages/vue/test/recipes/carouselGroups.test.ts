import { describe, expect, it } from 'vitest'
import { createCarouselGroups } from '../../src/integrations/embla/groups'

describe('canonical carousel groups', () => {
  it('uses one deterministic model for snaps and slides', () => {
    expect(createCarouselGroups(5, 2)).toEqual({
      slidesBySnap: [[0, 1], [2, 3], [4]],
      snapBySlide: { 0: 0, 1: 0, 2: 1, 3: 1, 4: 2 },
    })
  })

  it('normalizes invalid group sizes without vendor state', () => {
    expect(createCarouselGroups(2, Number.NaN).slidesBySnap).toEqual([[0], [1]])
    expect(createCarouselGroups(2, 8).slidesBySnap).toEqual([[0, 1]])
  })
})
