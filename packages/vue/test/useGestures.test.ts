// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { useGestures } from '@nuxt-photo/vue'
import { createPhotoSet } from '@test-fixtures/photos'

function createGestureConfig(zoomedIn = false) {
  const isZoomedIn = ref(zoomedIn)
  const currentScale = zoomedIn ? 2 : 1
  const currentPan = ref({ x: 0, y: 0 })
  const panzoomMotion = {
    x: currentPan.value.x,
    y: currentPan.value.y,
    scale: currentScale,
    targetX: currentPan.value.x,
    targetY: currentPan.value.y,
    targetScale: currentScale,
    velocityX: 0,
    velocityY: 0,
    velocityScale: 0,
    tension: 170,
    friction: 17,
    rafId: 0,
  }

  const setPanzoomImmediate = vi.fn((scale: number, pan: { x: number; y: number }) => {
    panzoomMotion.scale = scale
    panzoomMotion.x = pan.x
    panzoomMotion.y = pan.y
    currentPan.value = pan
  })

  return {
    config: {
      lightboxMounted: ref(true),
      animating: ref(false),
      ghostVisible: ref(false),
      isZoomedIn: computed(() => isZoomedIn.value),
      zoomAllowed: computed(() => true),
      mediaAreaRef: ref(document.createElement('div')),
      currentPhoto: computed(() => createPhotoSet()[0]!),
      areaMetrics: ref({ left: 0, top: 0, width: 1200, height: 800 }),
      uiVisible: ref(true),
      panState: currentPan,
      zoomState: ref({ fit: 1, secondary: 2, max: 3, current: currentScale }),
      closeDragY: ref(0),
      controlsDisabled: computed(() => false),

      panzoomMotion,
      setPanzoomImmediate,
      startPanzoomSpring: vi.fn(),
      clampPan: vi.fn((pan: { x: number; y: number }) => pan),
      clampPanWithResistance: vi.fn((pan: { x: number; y: number }) => pan),
      applyWheelZoom: vi.fn(),
      toggleZoom: vi.fn(),
      getPanBounds: vi.fn(() => ({ x: 220, y: 120 })),

      goToNext: vi.fn(),
      goToPrev: vi.fn(),
      goTo: vi.fn(),
      selectedSnap: vi.fn(() => 0),

      handleCloseGesture: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    },
    setPanzoomImmediate,
  }
}

describe('useGestures', () => {
  it('closes on Escape when the lightbox is mounted and idle', () => {
    const { config } = createGestureConfig(false)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(config.close).toHaveBeenCalledTimes(1)
  })

  it('navigates with arrow keys when not zoomed in', () => {
    const { config } = createGestureConfig(false)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).toHaveBeenCalledTimes(1)
    expect(config.goToPrev).toHaveBeenCalledTimes(1)
    expect(config.setPanzoomImmediate).not.toHaveBeenCalled()
  })

  it('pans with arrow keys instead of navigating when zoomed in', () => {
    const { config, setPanzoomImmediate } = createGestureConfig(true)
    const gestures = useGestures(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).not.toHaveBeenCalled()
    expect(config.goToPrev).not.toHaveBeenCalled()
    expect(setPanzoomImmediate).toHaveBeenNthCalledWith(1, 2, { x: -80, y: 0 })
    expect(setPanzoomImmediate).toHaveBeenNthCalledWith(2, 2, { x: 0, y: 0 })
  })
})
