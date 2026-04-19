import { describe, expect, it } from 'vitest'
import {
  getResponsiveBreakpoints,
  mergeResponsiveBreakpoints,
  responsive,
  resolveResponsiveParameter,
} from '../src/types'

describe('responsive()', () => {
  it('returns the value for the largest matching breakpoint', () => {
    const fn = responsive({ 0: 2, 600: 3, 900: 4 })
    expect(fn(0)).toBe(2)
    expect(fn(599)).toBe(2)
    expect(fn(600)).toBe(3)
    expect(fn(899)).toBe(3)
    expect(fn(900)).toBe(4)
    expect(fn(1200)).toBe(4)
  })

  it('works with a single breakpoint', () => {
    const fn = responsive({ 0: 8 })
    expect(fn(0)).toBe(8)
    expect(fn(1000)).toBe(8)
  })

  it('works with non-zero minimum breakpoint', () => {
    const fn = responsive({ 400: 'small', 800: 'large' })
    // Below smallest breakpoint falls back to smallest value
    expect(fn(200)).toBe('small')
    expect(fn(400)).toBe('small')
    expect(fn(800)).toBe('large')
  })

  it('throws on empty breakpoints', () => {
    expect(() => responsive({})).toThrow('at least one breakpoint')
  })

  it('integrates with resolveResponsiveParameter', () => {
    const fn = responsive({ 0: 4, 600: 8 })
    expect(resolveResponsiveParameter(fn, 300, 0)).toBe(4)
    expect(resolveResponsiveParameter(fn, 700, 0)).toBe(8)
  })

  it('exposes breakpoint metadata for responsive() resolvers', () => {
    const fn = responsive({ 0: 4, 600: 8, 900: 12 })
    expect(getResponsiveBreakpoints(fn)).toEqual([0, 600, 900])
  })

  it('merges responsive breakpoint metadata across multiple parameters', () => {
    const spacing = responsive({ 0: 4, 600: 8 })
    const columns = responsive({ 0: 1, 840: 3, 1120: 4 })

    expect(mergeResponsiveBreakpoints([spacing, columns])).toEqual([
      300, 600, 840, 1120,
    ])
  })

  it('returns undefined when no responsive metadata is available', () => {
    expect(
      mergeResponsiveBreakpoints([
        8,
        undefined,
        (width: number) => (width > 600 ? 8 : 4),
      ]),
    ).toBeUndefined()
  })
})
