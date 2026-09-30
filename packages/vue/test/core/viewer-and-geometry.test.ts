import { describe, expect, it } from 'vite-plus/test'
import {
  DEFAULT_MIN_ZOOM,
  clampPanToBounds,
  classifyGesture,
  computePanBounds,
  computeTargetPanForZoom,
  computeZoomLevels,
  coverPose,
  fitRect,
  getLoopedIndex,
  isDoubleTap,
  rubberband,
} from '../../src/core/index'
import { getLightboxFrameArea } from '../../src/lightbox/carousel'

describe('geometry and viewer utilities', () => {
  it('fits desktop photos inside a responsive mat without shrinking the swipe track', () => {
    expect(getLightboxFrameArea({ left: 0, top: 0, width: 2000, height: 1000 })).toEqual({
      left: 120,
      top: 70,
      width: 1760,
      height: 860,
    })
    expect(getLightboxFrameArea({ left: 0, top: 0, width: 390, height: 844 })).toEqual({
      left: 12,
      top: 24,
      width: 366,
      height: 796,
    })
  })

  it('poses a photo frame over a cropped thumbnail without stretching it', () => {
    // A portrait photo frame flying from a wide, cropped thumbnail.
    const frame = { left: 400, top: 100, width: 400, height: 600 }
    const thumb = { left: 50, top: 300, width: 200, height: 100 }
    const pose = coverPose(frame, thumb, 4)

    // One scale for both axes: the thumbnail's width decides (cover), so the photo keeps its shape.
    expect(pose.transform).toBe('translate(-350px, 100px) scale(0.5)')
    // The visible part after the clip is exactly the thumbnail: 200 × 100 at scale 0.5.
    expect(pose.clipPath).toBe('inset(200px 0px round 8px)')
  })

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

  it('bounds panning by the drawn frame, not the whole screen', () => {
    // A 1000×500 frame in a 1200×800 area: at 2× it overflows by 400 and 100 per axis.
    const bounds = computePanBounds({ width: 1000, height: 500 }, { width: 1200, height: 800 }, 2)

    expect(rubberband(-20, 0, 100)).toBe(-4)
    expect(bounds).toEqual({ x: 400, y: 100 })
    expect(clampPanToBounds({ x: 700, y: -500 }, bounds)).toEqual({ x: 400, y: -100 })
  })

  it('zooms to real pixels, with the default minZoom as a floor', () => {
    // A 2400px photo drawn 1200px wide: the click target is its real pixels, 2×.
    expect(computeZoomLevels(2400, 1600, 1200, 800)).toEqual({
      fit: 1,
      secondary: 2,
      max: 2,
      current: 1,
    })

    // Large photo: one click shows real pixels (3.33×), capped at 4×.
    const large = computeZoomLevels(4000, 2000, 1200, 600)
    expect(large.secondary).toBeCloseTo(3.33, 2)
    expect(computeZoomLevels(8000, 4000, 1200, 600).secondary).toBe(4)

    // Near-native resolution: the default minZoom keeps zoom useful.
    const nearNative = computeZoomLevels(1280, 800, 1240, 775)
    expect(nearNative.max).toBe(DEFAULT_MIN_ZOOM)
    expect(nearNative.fit).toBe(1)
    expect(nearNative.current).toBe(1)

    // Photo smaller than display area: the default minZoom floor still applies
    const small = computeZoomLevels(600, 400, 1200, 800)
    expect(small.max).toBe(DEFAULT_MIN_ZOOM)
    expect(small.secondary).toBe(DEFAULT_MIN_ZOOM)

    // Lightbox-level minZoom via options
    const optMin = computeZoomLevels(600, 400, 1200, 800, {
      minZoom: 1,
    })
    expect(optMin.max).toBe(1)
    expect(optMin.secondary).toBe(1)

    // Application metadata never changes viewer behavior.
    const withMeta = computeZoomLevels(600, 400, 1200, 800)
    expect(withMeta.max).toBe(DEFAULT_MIN_ZOOM)
  })

  it('keeps zoom-out centered and clamps zoom-in targets to bounds', () => {
    expect(
      computeTargetPanForZoom(1, 2, { x: 120, y: -80 }, { x: 240, y: -160 }, 1, { x: 600, y: 400 }),
    ).toEqual({ x: 0, y: 0 })

    expect(
      computeTargetPanForZoom(2, 1, { x: 0, y: 0 }, { x: 500, y: -500 }, 1, {
        x: 300,
        y: 200,
      }),
    ).toEqual({ x: -300, y: 200 })
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

  it('detects double taps', () => {
    expect(isDoubleTap(200, { time: 0, clientX: 10, clientY: 10 }, 18, 14)).toBe(true)
    expect(isDoubleTap(300, { time: 0, clientX: 10, clientY: 10 }, 60, 60)).toBe(false)
  })
})
