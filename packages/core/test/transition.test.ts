import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createTransitionMode,
  getVisibilityRatio,
  planCloseTransition,
  shouldUseFlip,
} from '@nuxt-photo/core'

function rect({
  left,
  top,
  width,
  height,
}: {
  left: number
  top: number
  width: number
  height: number
}) {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('transition planning', () => {
  it('computes visibility ratios against the viewport', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    expect(getVisibilityRatio(rect({ left: 0, top: 0, width: 200, height: 100 }))).toBe(1)
    expect(getVisibilityRatio(rect({ left: -100, top: 0, width: 200, height: 100 }))).toBe(0.5)
  })

  it('uses transition mode rules for FLIP eligibility', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'none', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'fade', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 0, top: 0, width: 300, height: 200 }), { mode: 'flip', autoThreshold: 0.55 })).toBe(true)
    expect(shouldUseFlip(rect({ left: -220, top: 100, width: 400, height: 400 }), { mode: 'auto', autoThreshold: 0.55 })).toBe(false)
    expect(shouldUseFlip(rect({ left: 40, top: 40, width: 300, height: 220 }), { mode: 'auto', autoThreshold: 0.55 })).toBe(true)
  })

  it('plans close transitions for forced modes, unusable thumbs, low visibility, and good geometry', () => {
    vi.stubGlobal('window', { innerWidth: 1200, innerHeight: 800 })

    const fromRect = { left: 100, top: 120, width: 900, height: 500 }

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: { mode: 'none', autoThreshold: 0.55 },
    })).toMatchObject({ mode: 'instant', reason: 'mode-forced-none' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: { mode: 'fade', autoThreshold: 0.55 },
    })).toMatchObject({ mode: 'fade', reason: 'mode-forced-fade' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 20, height: 20 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'fade', reason: 'thumb-off-screen' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: -220, top: 100, width: 400, height: 400 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'fade', reason: 'visibility-below-threshold' })

    expect(planCloseTransition({
      fromRect,
      toRect: rect({ left: 40, top: 40, width: 300, height: 220 }) as DOMRect,
      thumbRefExists: true,
      config: createTransitionMode(),
    })).toMatchObject({ mode: 'flip', reason: 'ok' })
  })
})
