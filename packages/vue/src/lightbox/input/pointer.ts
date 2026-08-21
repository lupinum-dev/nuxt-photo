import { computed, shallowRef } from 'vue'
import {
  classifyGesture as coreClassifyGesture,
  clientToAreaPoint,
  computeTargetPanForZoom,
  type GestureMode,
} from '../../core/index'
import { VelocityTracker } from './velocity'
import { createKeyboardWheelHandlers } from './keyboardWheel'
import type { GestureInputConfig, GestureSession } from './types'
import { createPointerResources, getPointerPairGeometry } from './pointerResources'
import { createTapHandler } from './tap'

/**
 * Classify pointer and wheel input into slide, pan, zoom, and close gestures,
 * then dispatch the appropriate runtime side effects.
 */
export function useLightboxInputHandlers(config: GestureInputConfig) {
  const { state, panzoom, navigation, lifecycle } = config
  const session = shallowRef<GestureSession>({ kind: 'idle' })
  const gesturePhase = computed<GestureMode>(() =>
    session.value.kind === 'tap' ? 'idle' : session.value.kind,
  )

  const pointers = createPointerResources(state.mediaAreaRef)
  const { activePointers, capturedPointers } = pointers

  const velocityTracker = new VelocityTracker(100)
  const tap = createTapHandler(() => {
    state.uiVisible.value = !state.uiVisible.value
  }, panzoom.toggleZoom)
  const keyboardWheel = createKeyboardWheelHandlers({
    isOpen: state.isOpen,
    animating: state.animating,
    isZoomedIn: state.isZoomedIn,
    transitionInProgress: state.transitionInProgress,
    getCurrentScale: panzoom.getCurrentScale,
    getCurrentPan: panzoom.getCurrentPan,
    setCurrentPanImmediate: panzoom.setCurrentPanImmediate,
    clampPan: panzoom.clampPan,
    applyWheelZoom: panzoom.applyWheelZoom,
    toggleZoom: panzoom.toggleZoom,
    goToNext: navigation.goToNext,
    goToPrev: navigation.goToPrev,
    goToFirst: navigation.goToFirst,
    goToLast: navigation.goToLast,
    close: lifecycle.close,
    reportAsyncError: lifecycle.reportAsyncError,
  })

  function resetGestureState() {
    pointers.releaseAll()
    session.value = { kind: 'idle' }
    activePointers.clear()
  }

  function classifyGesture(deltaX: number, deltaY: number, pointerType: string): GestureMode {
    const photo = state.currentPhoto.value
    if (!photo) return 'idle'

    const bounds = panzoom.getPanBounds(photo, state.zoomState.value.current)
    return coreClassifyGesture(
      deltaX,
      deltaY,
      pointerType,
      state.isZoomedIn.value,
      bounds,
      state.panState.value,
    )
  }

  function startPinchGesture() {
    const pair = pointers.getPointerPair()
    if (!pair || !state.zoomAllowed.value) return false

    const { distance, center } = getPointerPairGeometry(pair)
    if (distance <= 0) return false

    const pinch: GestureSession & { kind: 'pinch' } = {
      kind: 'pinch',
      pointerIds: [pair[0].id, pair[1].id],
      startDistance: distance,
      startCenter: center,
      startScale: panzoom.getCurrentScale(),
      startPan: panzoom.getCurrentPan(),
      moved: false,
    }
    session.value = pinch
    navigation.goTo(navigation.selectedSnap(), true)
    for (const pointer of activePointers.values()) {
      pointers.capture(pointer.id)
    }
    return true
  }

  function applyPinchGesture(event: PointerEvent) {
    const photo = state.currentPhoto.value
    const pair = pointers.getPointerPair()
    const pinch = session.value
    if (pinch.kind !== 'pinch' || !photo || !pair) return

    event.preventDefault()
    event.stopPropagation()

    const { distance, center } = getPointerPairGeometry(pair)
    const scaleRatio = distance / pinch.startDistance
    const targetScale = Math.min(
      state.zoomState.value.max,
      Math.max(state.zoomState.value.fit, pinch.startScale * scaleRatio),
    )

    const area = state.areaMetrics.value
    const startPoint = area
      ? clientToAreaPoint(
          pinch.startCenter.x,
          pinch.startCenter.y,
          area.left,
          area.top,
          area.width,
          area.height,
        )
      : { x: 0, y: 0 }
    const bounds = panzoom.getPanBounds(photo, targetScale)
    const scalePan = computeTargetPanForZoom(
      targetScale,
      pinch.startScale,
      pinch.startPan,
      startPoint,
      state.zoomState.value.fit,
      bounds,
    )
    const targetPan = {
      x: scalePan.x + (center.x - pinch.startCenter.x),
      y: scalePan.y + (center.y - pinch.startCenter.y),
    }

    pinch.moved =
      pinch.moved ||
      Math.abs(distance - pinch.startDistance) > 4 ||
      Math.abs(center.x - pinch.startCenter.x) > 4 ||
      Math.abs(center.y - pinch.startCenter.y) > 4

    panzoom.setPanzoomImmediate(
      targetScale,
      panzoom.clampPanWithResistance(targetPan, targetScale, photo),
      false,
    )
  }

  function settlePinchGesture() {
    const photo = state.currentPhoto.value
    const targetScale = panzoom.getCurrentScale()
    const clampedPan = photo
      ? panzoom.clampPan(panzoom.getCurrentPan(), targetScale, photo)
      : { x: 0, y: 0 }

    panzoom.startPanzoomSpring(targetScale, clampedPan, {
      tension: 190,
      friction: 20,
    })
  }

  function onMediaPointerDown(event: PointerEvent) {
    if (!state.isOpen.value) return

    if (state.animating.value) {
      event.stopPropagation()
      return
    }

    if (event.pointerType === 'mouse' && event.button !== 0) return

    activePointers.set(event.pointerId, {
      id: event.pointerId,
      pointerType: event.pointerType,
      clientX: event.clientX,
      clientY: event.clientY,
    })

    if (activePointers.size >= 2) {
      event.preventDefault()
      event.stopPropagation()
      if (startPinchGesture()) return
      session.value = { kind: 'idle' }
      return
    }

    if (state.isZoomedIn.value) {
      event.stopPropagation()
    }

    tap.cancel()
    velocityTracker.reset()
    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    session.value = {
      kind: 'tap',
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      startPan: panzoom.getCurrentPan(),
    }

    if (state.isZoomedIn.value) {
      pointers.capture(event.pointerId)
    }
  }

  function onMediaPointerMove(event: PointerEvent) {
    const tracked = activePointers.get(event.pointerId)
    if (tracked) {
      tracked.clientX = event.clientX
      tracked.clientY = event.clientY
    }

    if (session.value.kind === 'pinch') {
      applyPinchGesture(event)
      return
    }

    if (activePointers.size >= 2) {
      event.preventDefault()
      event.stopPropagation()
      if (startPinchGesture()) {
        applyPinchGesture(event)
      }
      return
    }

    let pointer = session.value
    if (pointer.kind === 'idle') return
    if (event.pointerId !== pointer.id) return

    const deltaX = event.clientX - pointer.startX
    const deltaY = event.clientY - pointer.startY

    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointer.lastX = event.clientX
    pointer.lastY = event.clientY
    pointer.moved = pointer.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (pointer.kind === 'tap') {
      const mode = classifyGesture(deltaX, deltaY, pointer.pointerType)
      if (mode !== 'idle') {
        if (mode === 'pinch') return
        session.value = { ...pointer, kind: mode }
        pointer = session.value as typeof pointer

        if (mode === 'close') {
          event.stopPropagation()
          navigation.goTo(navigation.selectedSnap(), true)
          pointers.capture(event.pointerId)
        }

        if (mode === 'slide' && state.isZoomedIn.value) {
          if (deltaX > 0) {
            navigation.goToPrev()
          } else {
            navigation.goToNext()
          }
          resetGestureState()
          return
        }
      }
    }

    if (pointer.kind === 'close' || pointer.kind === 'pan') {
      event.stopPropagation()
    }

    if (pointer.kind === 'close') {
      lifecycle.setCloseDragY(deltaY)
      return
    }

    if (pointer.kind === 'pan') {
      const targetPan = {
        x: pointer.startPan.x + deltaX,
        y: pointer.startPan.y + deltaY,
      }
      panzoom.setPanzoomImmediate(
        panzoom.getCurrentScale(),
        panzoom.clampPanWithResistance(targetPan, panzoom.getCurrentScale()),
        false,
      )
    }
  }

  async function onMediaPointerUp(event: PointerEvent) {
    const currentSession = session.value
    const wasPinching = currentSession.kind === 'pinch'
    activePointers.delete(event.pointerId)

    if (wasPinching) {
      pointers.release(event.pointerId)

      if (activePointers.size >= 2) {
        startPinchGesture()
        return
      }

      const pinch = currentSession
      for (const pointer of activePointers.values()) {
        pointers.release(pointer.id)
      }
      resetGestureState()
      event.preventDefault()
      event.stopPropagation()
      if (pinch.moved) {
        settlePinchGesture()
      }
      return
    }

    if (currentSession.kind === 'idle') return
    if (event.pointerId !== currentSession.id) return

    if (capturedPointers.has(event.pointerId)) {
      pointers.release(event.pointerId)
    }

    const deltaY = event.clientY - currentSession.startY
    const mode = currentSession.kind === 'tap' ? 'idle' : currentSession.kind

    const { vy: velocityY } = velocityTracker.getVelocity()

    resetGestureState()

    if (mode === 'close' || mode === 'pan') {
      event.stopPropagation()
    }

    if (!currentSession.moved || mode === 'idle') {
      tap.handle(event.clientX, event.clientY)
      return
    }

    if (mode === 'close') {
      await lifecycle.handleCloseGesture(deltaY, velocityY, lifecycle.close)
      return
    }

    if (mode === 'pan') {
      panzoom.settleCurrentTransform({
        tension: 170,
        friction: 17,
      })
    }
  }

  function onMediaPointerCancel(event: PointerEvent) {
    const currentSession = session.value
    const wasPinching = currentSession.kind === 'pinch'
    activePointers.delete(event.pointerId)

    if (wasPinching) {
      settlePinchGesture()
      resetGestureState()
      lifecycle.setCloseDragY(0)
      return
    }

    if (currentSession.kind === 'idle') return
    if (event.pointerId !== currentSession.id) return

    const hadCapture = capturedPointers.has(event.pointerId)
    resetGestureState()

    if (state.isZoomedIn.value || hadCapture) {
      panzoom.setCurrentPanImmediate(
        panzoom.clampPan(panzoom.getCurrentPan(), panzoom.getCurrentScale()),
      )
    }
    lifecycle.setCloseDragY(0)
  }

  function disposeGestureState() {
    tap.dispose()
    resetGestureState()
  }

  return {
    gesturePhase,
    resetGestureState,
    disposeGestureState,
    cancelTapTimer: tap.cancel,
    onMediaPointerDown,
    onMediaPointerMove,
    onMediaPointerUp,
    onMediaPointerCancel,
    ...keyboardWheel,
  }
}
