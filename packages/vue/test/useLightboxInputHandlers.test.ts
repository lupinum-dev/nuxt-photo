// @vitest-environment jsdom

import { computed, ref } from 'vue'
import { describe, expect, it, vi } from 'vite-plus/test'
import { useLightboxInputHandlers } from '../src/lightbox/input/pointer'
import { createPhotoSet } from '@test-fixtures/photos'

function createGestureConfig(zoomedIn = false, zoomAllowed = true) {
  const isZoomedIn = ref(zoomedIn)
  let currentScale = zoomedIn ? 2 : 1
  const currentPan = ref({ x: 0, y: 0 })
  const mediaArea = document.createElement('div')
  mediaArea.setPointerCapture = vi.fn()
  mediaArea.releasePointerCapture = vi.fn()
  const setPanzoomImmediate = vi.fn((scale: number, pan: { x: number; y: number }) => {
    currentScale = scale
    currentPan.value = pan
  })
  const setCurrentPanImmediate = vi.fn((pan: { x: number; y: number }) => {
    currentPan.value = pan
  })

  const config = {
    isOpen: ref(true),
    animating: ref(false),
    isZoomedIn: computed(() => isZoomedIn.value),
    zoomAllowed: computed(() => zoomAllowed),
    mediaAreaRef: ref(mediaArea),
    currentPhoto: computed(() => createPhotoSet()[0]!),
    areaMetrics: ref({ left: 0, top: 0, width: 1200, height: 800 }),
    uiVisible: ref(true),
    panState: currentPan,
    zoomState: ref({ fit: 1, secondary: 2, max: 3, current: currentScale }),
    closeDragY: ref(0),
    setCloseDragY: vi.fn(),
    transitionInProgress: computed(() => false),

    getCurrentScale: () => currentScale,
    getCurrentPan: () => currentPan.value,
    setCurrentPanImmediate,
    settleCurrentTransform: vi.fn(),
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
    goToFirst: vi.fn(),
    goToLast: vi.fn(),

    handleCloseGesture: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  }

  const input = {
    state: {
      isOpen: config.isOpen,
      animating: config.animating,
      isZoomedIn: config.isZoomedIn,
      zoomAllowed: config.zoomAllowed,
      mediaAreaRef: config.mediaAreaRef,
      currentPhoto: config.currentPhoto,
      areaMetrics: config.areaMetrics,
      uiVisible: config.uiVisible,
      panState: config.panState,
      zoomState: config.zoomState,
      transitionInProgress: config.transitionInProgress,
    },
    panzoom: {
      getCurrentScale: config.getCurrentScale,
      getCurrentPan: config.getCurrentPan,
      setCurrentPanImmediate: config.setCurrentPanImmediate,
      settleCurrentTransform: config.settleCurrentTransform,
      setPanzoomImmediate: config.setPanzoomImmediate,
      startPanzoomSpring: config.startPanzoomSpring,
      clampPan: config.clampPan,
      clampPanWithResistance: config.clampPanWithResistance,
      applyWheelZoom: config.applyWheelZoom,
      toggleZoom: config.toggleZoom,
      getPanBounds: config.getPanBounds,
    },
    navigation: {
      goToNext: config.goToNext,
      goToPrev: config.goToPrev,
      goTo: config.goTo,
      selectedSnap: config.selectedSnap,
      goToFirst: config.goToFirst,
      goToLast: config.goToLast,
    },
    lifecycle: {
      setCloseDragY: config.setCloseDragY,
      handleCloseGesture: config.handleCloseGesture,
      close: config.close,
      reportAsyncError: (_operation, task) => void task,
    },
  }

  return {
    config: Object.assign(config, input),
    input,
    setPanzoomImmediate,
    setCurrentPanImmediate,
  }
}

describe('useLightboxInputHandlers', () => {
  it('closes on Escape when the lightbox is mounted and idle', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(config.close).toHaveBeenCalledTimes(1)
  })

  it('navigates with arrow keys when not zoomed in', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).toHaveBeenCalledTimes(1)
    expect(config.goToPrev).toHaveBeenCalledTimes(1)
    expect(config.setPanzoomImmediate).not.toHaveBeenCalled()
  })

  it('jumps to the first and last slide with Home and End', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'Home' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'End' }))

    expect(config.goToFirst).toHaveBeenCalledTimes(1)
    expect(config.goToLast).toHaveBeenCalledTimes(1)
  })

  it('pans with arrow keys instead of navigating when zoomed in', () => {
    const { config, setCurrentPanImmediate } = createGestureConfig(true)
    const gestures = useLightboxInputHandlers(config)

    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    gestures.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))

    expect(config.goToNext).not.toHaveBeenCalled()
    expect(config.goToPrev).not.toHaveBeenCalled()
    expect(setCurrentPanImmediate).toHaveBeenNthCalledWith(1, { x: -80, y: 0 })
    expect(setCurrentPanImmediate).toHaveBeenNthCalledWith(2, { x: 0, y: 0 })
  })

  it('ignores keydown events that were already handled', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)
    const event = new KeyboardEvent('keydown', {
      key: 'Escape',
      cancelable: true,
    })
    event.preventDefault()

    gestures.onKeydown(event)

    expect(config.close).not.toHaveBeenCalled()
  })

  it('ignores global shortcuts from editable content', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)
    const input = document.createElement('input')
    input.addEventListener('keydown', gestures.onKeydown)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }))

    expect(config.goToNext).not.toHaveBeenCalled()
    expect(config.toggleZoom).not.toHaveBeenCalled()
  })

  it('supports mixed pointer types across consecutive gesture sessions', async () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 10,
        clientY: 10,
      }),
    )
    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 10,
        clientY: 90,
      }),
    )
    await gestures.onMediaPointerUp(
      new PointerEvent('pointerup', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 10,
        clientY: 120,
      }),
    )

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'mouse',
        button: 0,
        clientX: 20,
        clientY: 20,
      }),
    )
    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'mouse',
        clientX: 120,
        clientY: 20,
      }),
    )
    await gestures.onMediaPointerUp(
      new PointerEvent('pointerup', {
        pointerId: 2,
        pointerType: 'mouse',
        button: 0,
        clientX: 180,
        clientY: 20,
      }),
    )

    expect(config.handleCloseGesture).toHaveBeenCalledTimes(1)
    expect(config.goToNext).not.toHaveBeenCalled()
  })

  it('pinch-zooms with two active touch pointers', async () => {
    const { config, setPanzoomImmediate } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 200,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 300,
        clientY: 100,
      }),
    )

    expect(gestures.gesturePhase.value).toBe('pinch')
    expect(setPanzoomImmediate).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      false,
    )
    expect(config.goTo).toHaveBeenCalledWith(0, true)

    await gestures.onMediaPointerUp(
      new PointerEvent('pointerup', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 300,
        clientY: 100,
      }),
    )

    expect(config.startPanzoomSpring).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      { tension: 190, friction: 20 },
    )
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(2)
    expect(gestures.gesturePhase.value).toBe('idle')
  })

  it('keeps a pinch alive when one pointer leaves a three-pointer gesture', async () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 200,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 3,
        pointerType: 'touch',
        clientX: 300,
        clientY: 100,
      }),
    )

    await gestures.onMediaPointerUp(
      new PointerEvent('pointerup', {
        pointerId: 3,
        pointerType: 'touch',
        clientX: 300,
        clientY: 100,
      }),
    )

    expect(gestures.gesturePhase.value).toBe('pinch')
    expect(config.startPanzoomSpring).not.toHaveBeenCalled()
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(3)

    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 260,
        clientY: 100,
      }),
    )

    expect(config.setPanzoomImmediate).toHaveBeenCalled()
  })

  it('settles and releases pointer capture when pinch is cancelled', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 200,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 260,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerCancel(
      new PointerEvent('pointercancel', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 260,
        clientY: 100,
      }),
    )

    expect(gestures.gesturePhase.value).toBe('idle')
    expect(config.startPanzoomSpring).toHaveBeenCalledWith(
      expect.any(Number),
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
      { tension: 190, friction: 20 },
    )
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(1)
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(2)
  })

  it('totally resets an active pinch when its owner is disposed', () => {
    const { config } = createGestureConfig(false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 12,
        pointerType: 'touch',
        clientX: 200,
        clientY: 100,
      }),
    )
    expect(gestures.gesturePhase.value).toBe('pinch')

    gestures.disposeGestureState()

    expect(gestures.gesturePhase.value).toBe('idle')
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(11)
    expect(config.mediaAreaRef.value?.releasePointerCapture).toHaveBeenCalledWith(12)
  })

  it('ignores multi-touch when pinch zoom is disabled', async () => {
    const { config } = createGestureConfig(false, false)
    const gestures = useLightboxInputHandlers(config)

    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 1,
        pointerType: 'touch',
        clientX: 100,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerDown(
      new PointerEvent('pointerdown', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 200,
        clientY: 100,
      }),
    )
    gestures.onMediaPointerMove(
      new PointerEvent('pointermove', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 240,
        clientY: 100,
      }),
    )
    await gestures.onMediaPointerUp(
      new PointerEvent('pointerup', {
        pointerId: 2,
        pointerType: 'touch',
        clientX: 240,
        clientY: 100,
      }),
    )

    expect(gestures.gesturePhase.value).toBe('idle')
    expect(config.setPanzoomImmediate).not.toHaveBeenCalled()
    expect(config.goToNext).not.toHaveBeenCalled()
    expect(config.goToPrev).not.toHaveBeenCalled()
    expect(config.handleCloseGesture).not.toHaveBeenCalled()
  })
})
