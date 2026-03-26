import { describe, expect, it } from 'vitest'
import {
  clampPanToBounds,
  classifyGesture,
  computeCloseDragRatio,
  computePanBounds,
  computeTargetPanForZoom,
  computeZoomLevels,
  fitRect,
  getActiveId,
  getLoopedIndex,
  isDoubleTap,
  isViewerOpen,
  rubberband,
  viewerTransition,
} from '@nuxt-photo/core'

describe('geometry and viewer utilities', () => {
  it('fits rectangles and loops indexes predictably', () => {
    expect(fitRect({ left: 0, top: 0, width: 100, height: 100 }, 2)).toEqual({
      left: 0,
      top: 25,
      width: 100,
      height: 50,
    })
    expect(getLoopedIndex(-1, 5)).toBe(4)
    expect(getLoopedIndex(5, 5)).toBe(0)
  })

  it('applies rubberbanding and zoom math correctly', () => {
    const zoom = computeZoomLevels(2400, 1600, 1200, 800)
    const bounds = computePanBounds(2400, 1600, 1200, 800, 2)

    expect(rubberband(-20, 0, 100)).toBe(-4)
    expect(zoom).toEqual({ fit: 1, secondary: 2, max: 2, current: 1 })
    expect(bounds).toEqual({ x: 600, y: 400 })
    expect(clampPanToBounds({ x: 700, y: -500 }, bounds)).toEqual({ x: 600, y: -400 })
  })

  it('keeps zoom-out centered and clamps zoom-in targets to bounds', () => {
    expect(
      computeTargetPanForZoom(1, 2, { x: 120, y: -80 }, { x: 240, y: -160 }, 1, { x: 600, y: 400 }),
    ).toEqual({ x: 0, y: 0 })

    expect(
      computeTargetPanForZoom(2, 1, { x: 0, y: 0 }, { x: 500, y: -500 }, 1, { x: 300, y: 200 }),
    ).toEqual({ x: -300, y: 200 })
  })

  it('transitions viewer state through open, active change, and close', () => {
    const opening = viewerTransition({ status: 'closed' }, { type: 'open', activeId: 'one' })
    const opened = viewerTransition(opening, { type: 'opened' })
    const changed = viewerTransition(opened, { type: 'setActive', activeId: 'two' })
    const closing = viewerTransition(changed, { type: 'close' })
    const closed = viewerTransition(closing, { type: 'closed' })

    expect(opening).toEqual({ status: 'opening', activeId: 'one' })
    expect(isViewerOpen(opening)).toBe(true)
    expect(changed).toEqual({ status: 'open', activeId: 'two' })
    expect(getActiveId(changed)).toBe('two')
    expect(closed).toEqual({ status: 'closed' })
    expect(isViewerOpen(closed)).toBe(false)
    expect(getActiveId(closed)).toBeUndefined()
  })
})

describe('gesture helpers', () => {
  it('classifies idle, slide, close, pan, and edge-slide gestures', () => {
    expect(classifyGesture(4, 4, 'mouse', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('idle')
    expect(classifyGesture(40, 5, 'touch', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('slide')
    expect(classifyGesture(6, 40, 'touch', false, { x: 0, y: 0 }, { x: 0, y: 0 })).toBe('close')
    expect(classifyGesture(15, 12, 'touch', true, { x: 80, y: 40 }, { x: 0, y: 0 })).toBe('pan')
    expect(classifyGesture(24, 2, 'touch', true, { x: 80, y: 40 }, { x: 79, y: 0 })).toBe('slide')
  })

  it('detects double taps and close-drag ratios', () => {
    expect(isDoubleTap(200, { time: 0, clientX: 10, clientY: 10 }, 18, 14)).toBe(true)
    expect(isDoubleTap(300, { time: 0, clientX: 10, clientY: 10 }, 60, 60)).toBe(false)
    expect(computeCloseDragRatio(100, 1000)).toBeCloseTo(100 / 850, 6)
    expect(computeCloseDragRatio(1000, 300)).toBe(0.75)
  })
})
