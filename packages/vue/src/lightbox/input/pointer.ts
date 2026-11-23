import { computed, shallowRef } from 'vue'
import {
  classifyGesture as coreClassifyGesture,
  clientToAreaPoint,
  computeTargetPanForZoom,
  type GestureMode,
} from '../../core/index'
import { createVelocityTracker } from './velocity'
import { createKeyboardWheelHandlers } from './keyboardWheel'
import type { GestureInputConfig, GestureSession } from './types'
import { createPointerResources, getPointerPairGeometry } from './pointerResources'
import { createTapHandler } from './tap'

/** Keep an event from the page and from the other handlers. */
const swallow = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
}

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

  const velocityTracker = createVelocityTracker(100)
  const tap = createTapHandler(() => {
    state.uiVisible.value = !state.uiVisible.value
  }, panzoom.toggleZoom)
  const keyboardWheel = createKeyboardWheelHandlers({ ...state, ...panzoom, ...navigation })

  function resetGestureState() {
    pointers.releaseAll()
    session.value = { kind: 'idle' }
    activePointers.clear()
  }

  function classifyGesture(
    deltaX: number,
    deltaY: number,
    pointerType: string,
  ): Exclude<GestureMode, 'pinch'> {
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

    swallow(event)

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
      panzoom.getFrameOffset(photo),
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
      swallow(event)
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

    // A pointer that lands on a settling slide holds it and drags it from where it is.
    const caught = !state.isZoomedIn.value && navigation.catchSlide()
    if (caught) pointers.capture(event.pointerId)

    session.value = {
      kind: caught ? 'slide' : 'tap',
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lockX: event.clientX,
      lockY: event.clientY,
      moved: caught,
      startPan: panzoom.getCurrentPan(),
    }

    if (state.isZoomedIn.value) {
      pointers.capture(event.pointerId)
    }
  }

  function onMediaPointerMove(event: PointerEvent) {
    // Hidden controls return as soon as a mouse moves; only touch hides them for long.
    if (event.pointerType === 'mouse' && !state.uiVisible.value) state.uiVisible.value = true

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
      swallow(event)
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

    pointer.moved = pointer.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (pointer.kind === 'tap') {
      const mode = classifyGesture(deltaX, deltaY, pointer.pointerType)
      if (mode !== 'idle') {
        // The drag starts here: the slop that decided the direction is not drawn.
        session.value = { ...pointer, kind: mode, lockX: event.clientX, lockY: event.clientY }
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

        if (mode === 'slide') {
          navigation.beginSlide()
          pointers.capture(event.pointerId)
        }
      }
    }

    if (pointer.kind === 'close' || pointer.kind === 'pan') {
      event.stopPropagation()
    }

    const drawnX = event.clientX - pointer.lockX
    const drawnY = event.clientY - pointer.lockY

    if (pointer.kind === 'slide') {
      event.stopPropagation()
      navigation.dragSlide(drawnX)
      return
    }

    if (pointer.kind === 'close') {
      lifecycle.setCloseDragY(drawnY)
      return
    }

    if (pointer.kind === 'pan') {
      const targetPan = {
        x: pointer.startPan.x + drawnX,
        y: pointer.startPan.y + drawnY,
      }
      panzoom.setPanzoomImmediate(
        panzoom.getCurrentScale(),
        panzoom.clampPanWithResistance(targetPan, panzoom.getCurrentScale()),
        false,
      )
    }
  }

  /**
   * A click outside the photo closes. A mouse click on the photo zooms to its real
   * pixels, or back to fit. A touch tap on the photo waits briefly so a double tap
   * can zoom without the controls blinking first.
   */
  function handleTap(event: PointerEvent, pointerType: string) {
    // A caption is text to read or select, not the backdrop: a tap on it does nothing here.
    if (event.target instanceof Element && event.target.closest('[data-np-motion="caption"]')) {
      tap.cancel()
      return
    }
    const onPhoto = panzoom.isPointOnPhoto(event.clientX, event.clientY)
    if (pointerType === 'mouse') {
      tap.cancel()
      if (state.isZoomedIn.value) panzoom.toggleZoom()
      else if (!onPhoto) lifecycle.reportAsyncError('backdrop-close', lifecycle.close())
      else if (state.zoomAllowed.value) {
        panzoom.toggleZoom({ x: event.clientX, y: event.clientY })
      }
      return
    }
    if (!onPhoto && !state.isZoomedIn.value) {
      tap.cancel()
      lifecycle.reportAsyncError('backdrop-close', lifecycle.close())
      return
    }
    tap.handle(event.clientX, event.clientY)
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

      resetGestureState()
      swallow(event)
      if (currentSession.moved) settlePinchGesture()
      return
    }

    if (currentSession.kind === 'idle') return
    if (event.pointerId !== currentSession.id) return

    const deltaX = event.clientX - currentSession.startX
    const deltaY = event.clientY - currentSession.startY
    const mode = currentSession.kind === 'tap' ? 'idle' : currentSession.kind

    // A pointer that rested before lifting releases without speed.
    const { vx: velocityX, vy: velocityY } = velocityTracker.getVelocity(event.timeStamp)

    resetGestureState()

    if (mode === 'close' || mode === 'pan') {
      event.stopPropagation()
    }

    if (!currentSession.moved || mode === 'idle') {
      handleTap(event, currentSession.pointerType)
      return
    }

    if (mode === 'close') {
      await lifecycle.handleCloseGesture(deltaY, velocityY, lifecycle.close)
      return
    }

    if (mode === 'slide') {
      event.stopPropagation()
      navigation.releaseSlide(
        deltaX,
        velocityX,
        currentSession.pointerType,
        currentSession.lockX - currentSession.startX,
      )
      return
    }

    if (mode === 'pan') {
      panzoom.settleCurrentTransform()
    }
  }

  function onMediaPointerCancel(event: PointerEvent) {
    // Taking the capture from a touch's implicit target (the photo) makes that element lose
    // it; only a capture this area loses ends the gesture.
    if (event.type === 'lostpointercapture' && event.target !== state.mediaAreaRef.value) return
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
    const wasSliding = currentSession.kind === 'slide'
    resetGestureState()
    if (wasSliding) {
      const lead = currentSession.lockX - currentSession.startX
      navigation.releaseSlide(0, 0, currentSession.pointerType, lead)
    }

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
