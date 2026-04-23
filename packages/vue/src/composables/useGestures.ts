import { ref, type ComputedRef, type Ref } from 'vue'
import {
  classifyGesture as coreClassifyGesture,
  isDoubleTap as coreIsDoubleTap,
  VelocityTracker,
  clientToAreaPoint,
  computeTargetPanForZoom,
  type AreaMetrics,
  type GestureMode,
  type PanState,
  type PhotoItem,
  type ZoomState,
  type DebugLogger,
} from '@nuxt-photo/core'
import type { PanzoomMotion } from './lightboxRuntimeTypes'
import {
  MOUSE_WHEEL_THROTTLE_MS,
  TRACKPAD_WHEEL_THROTTLE_MS,
} from './constants'

type GestureConfig = {
  lightboxMounted: Ref<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  mediaAreaRef: Ref<HTMLElement | null>
  currentPhoto: ComputedRef<PhotoItem | null>
  areaMetrics: Ref<AreaMetrics | null>
  uiVisible: Ref<boolean>
  panState: Ref<PanState>
  zoomState: Ref<ZoomState>
  setCloseDragY: (val: number) => void
  transitionInProgress: ComputedRef<boolean>

  panzoomMotion: PanzoomMotion
  setPanzoomImmediate: (
    scale: number,
    pan: PanState,
    syncRefs?: boolean,
  ) => void
  startPanzoomSpring: (
    targetScale: number,
    targetPan: PanState,
    options?: { tension?: number; friction?: number },
  ) => void
  clampPan: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
  clampPanWithResistance: (
    pan: PanState,
    zoom?: number,
    photo?: PhotoItem,
  ) => PanState
  applyWheelZoom: (event: WheelEvent) => void
  toggleZoom: (clientPoint?: { x: number; y: number }) => void
  getPanBounds: (photo: PhotoItem, zoom: number) => { x: number; y: number }

  goToNext: () => void
  goToPrev: () => void
  goTo: (index: number, instant?: boolean) => void
  selectedSnap: () => number

  handleCloseGesture: (
    deltaY: number,
    velocityY: number,
    closeFn: () => Promise<void>,
  ) => Promise<void>
  close: () => Promise<void>
}

/**
 * Classify pointer and wheel input into slide, pan, zoom, and close gestures,
 * then dispatch the appropriate runtime side effects.
 */
export function useGestures(config: GestureConfig, debug?: DebugLogger) {
  const gesturePhase = ref<GestureMode>('idle')

  type TrackedPointer = {
    id: number
    pointerType: string
    clientX: number
    clientY: number
  }

  let pointerSession: {
    id: number
    pointerType: string
    startX: number
    startY: number
    lastX: number
    lastY: number
    moved: boolean
    startPan: PanState
  } | null = null

  let pinchSession: {
    startDistance: number
    startCenter: { x: number; y: number }
    startScale: number
    startPan: PanState
    moved: boolean
  } | null = null

  const activePointers = new Map<number, TrackedPointer>()
  const capturedPointers = new Set<number>()

  let tapTimer: ReturnType<typeof setTimeout> | undefined
  let lastTap: { time: number; clientX: number; clientY: number } | null = null
  let lastWheelTime = 0
  let emblaStolen = false

  const velocityTracker = new VelocityTracker(100)

  function resetGestureState() {
    releaseAllPointers()
    gesturePhase.value = 'idle'
    pointerSession = null
    pinchSession = null
    activePointers.clear()
    emblaStolen = false
  }

  function cancelTapTimer() {
    if (tapTimer) {
      clearTimeout(tapTimer)
      tapTimer = undefined
    }
  }

  function handleTap(clientX: number, clientY: number) {
    const now = performance.now()
    const doubleTap = coreIsDoubleTap(now, lastTap, clientX, clientY)

    cancelTapTimer()

    if (doubleTap) {
      lastTap = null
      debug?.log('gestures', 'double-tap → toggleZoom at', {
        x: clientX,
        y: clientY,
      })
      config.toggleZoom({ x: clientX, y: clientY })
      return
    }

    lastTap = { time: now, clientX, clientY }
    tapTimer = setTimeout(() => {
      debug?.log('gestures', 'single-tap → toggle UI visibility')
      config.uiVisible.value = !config.uiVisible.value
      tapTimer = undefined
    }, 220)
  }

  function classifyGesture(
    deltaX: number,
    deltaY: number,
    pointerType: string,
  ): GestureMode {
    const photo = config.currentPhoto.value
    if (!photo) return 'idle'

    const bounds = config.getPanBounds(photo, config.zoomState.value.current)
    return coreClassifyGesture(
      deltaX,
      deltaY,
      pointerType,
      config.isZoomedIn.value,
      bounds,
      config.panState.value,
    )
  }

  function getPointerPair() {
    const pointers = Array.from(activePointers.values())
    if (pointers.length < 2) return null
    return [pointers[0]!, pointers[1]!] as const
  }

  function getPairGeometry(pair: readonly [TrackedPointer, TrackedPointer]) {
    const [a, b] = pair
    const dx = b.clientX - a.clientX
    const dy = b.clientY - a.clientY
    return {
      distance: Math.hypot(dx, dy),
      center: {
        x: (a.clientX + b.clientX) / 2,
        y: (a.clientY + b.clientY) / 2,
      },
    }
  }

  function capturePointer(id: number) {
    try {
      config.mediaAreaRef.value?.setPointerCapture(id)
      capturedPointers.add(id)
    } catch {
      // Pointer capture is best-effort; Safari can throw during cancelled sequences.
    }
  }

  function releasePointer(id: number) {
    try {
      config.mediaAreaRef.value?.releasePointerCapture(id)
    } catch {
      // ignored
    } finally {
      capturedPointers.delete(id)
    }
  }

  function releaseAllPointers() {
    for (const id of capturedPointers) {
      releasePointer(id)
    }
  }

  function startPinchGesture() {
    const pair = getPointerPair()
    if (!pair || !config.zoomAllowed.value) return false

    const { distance, center } = getPairGeometry(pair)
    if (distance <= 0) return false

    pinchSession = {
      startDistance: distance,
      startCenter: center,
      startScale: config.panzoomMotion.scale,
      startPan: {
        x: config.panzoomMotion.x,
        y: config.panzoomMotion.y,
      },
      moved: false,
    }

    gesturePhase.value = 'pinch'
    emblaStolen = true
    pointerSession = null
    config.goTo(config.selectedSnap(), true)
    for (const pointer of activePointers.values()) {
      capturePointer(pointer.id)
    }
    debug?.log(
      'gestures',
      `pinch start: distance=${distance.toFixed(1)} scale=${pinchSession.startScale.toFixed(3)}`,
    )
    return true
  }

  function applyPinchGesture(event: PointerEvent) {
    const photo = config.currentPhoto.value
    const pair = getPointerPair()
    if (!pinchSession || !photo || !pair) return

    event.preventDefault()
    event.stopPropagation()

    const { distance, center } = getPairGeometry(pair)
    const scaleRatio = distance / pinchSession.startDistance
    const targetScale = Math.min(
      config.zoomState.value.max,
      Math.max(
        config.zoomState.value.fit,
        pinchSession.startScale * scaleRatio,
      ),
    )

    const area = config.areaMetrics.value
    const startPoint = area
      ? clientToAreaPoint(
          pinchSession.startCenter.x,
          pinchSession.startCenter.y,
          area.left,
          area.top,
          area.width,
          area.height,
        )
      : { x: 0, y: 0 }
    const bounds = config.getPanBounds(photo, targetScale)
    const scalePan = computeTargetPanForZoom(
      targetScale,
      pinchSession.startScale,
      pinchSession.startPan,
      startPoint,
      config.zoomState.value.fit,
      bounds,
    )
    const targetPan = {
      x: scalePan.x + (center.x - pinchSession.startCenter.x),
      y: scalePan.y + (center.y - pinchSession.startCenter.y),
    }

    pinchSession.moved =
      pinchSession.moved ||
      Math.abs(distance - pinchSession.startDistance) > 4 ||
      Math.abs(center.x - pinchSession.startCenter.x) > 4 ||
      Math.abs(center.y - pinchSession.startCenter.y) > 4

    config.setPanzoomImmediate(
      targetScale,
      config.clampPanWithResistance(targetPan, targetScale, photo),
      false,
    )
  }

  function settlePinchGesture() {
    const photo = config.currentPhoto.value
    const targetScale = config.panzoomMotion.scale
    const clampedPan = photo
      ? config.clampPan(
          { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
          targetScale,
          photo,
        )
      : { x: 0, y: 0 }

    config.startPanzoomSpring(targetScale, clampedPan, {
      tension: 190,
      friction: 20,
    })
  }

  function onMediaPointerDown(event: PointerEvent) {
    if (!config.lightboxMounted.value || config.ghostVisible.value) return

    if (config.animating.value) {
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
      pointerSession = null
      gesturePhase.value = 'idle'
      return
    }

    if (config.isZoomedIn.value) {
      event.stopPropagation()
    }

    cancelTapTimer()
    velocityTracker.reset()
    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointerSession = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
      startPan: {
        x: config.panzoomMotion.x,
        y: config.panzoomMotion.y,
      },
    }

    gesturePhase.value = 'idle'
    emblaStolen = false

    if (config.isZoomedIn.value) {
      capturePointer(event.pointerId)
    }
  }

  function onMediaPointerMove(event: PointerEvent) {
    const tracked = activePointers.get(event.pointerId)
    if (tracked) {
      tracked.clientX = event.clientX
      tracked.clientY = event.clientY
    }

    if (gesturePhase.value === 'pinch') {
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

    if (!pointerSession || event.pointerId !== pointerSession.id) return

    const deltaX = event.clientX - pointerSession.startX
    const deltaY = event.clientY - pointerSession.startY

    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointerSession.lastX = event.clientX
    pointerSession.lastY = event.clientY
    pointerSession.moved =
      pointerSession.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (gesturePhase.value === 'idle') {
      const mode = classifyGesture(deltaX, deltaY, pointerSession.pointerType)
      if (mode !== 'idle') {
        debug?.log(
          'gestures',
          `classified: ${mode} (deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} pointer=${pointerSession.pointerType})`,
        )
        gesturePhase.value = mode

        if (mode === 'close') {
          event.stopPropagation()
          emblaStolen = true
          config.goTo(config.selectedSnap(), true)
          capturePointer(event.pointerId)
        }

        if (mode === 'slide' && config.isZoomedIn.value) {
          if (deltaX > 0) {
            config.goToPrev()
          } else {
            config.goToNext()
          }
          resetGestureState()
          return
        }
      }
    }

    if (gesturePhase.value === 'close' || gesturePhase.value === 'pan') {
      event.stopPropagation()
    }

    if (gesturePhase.value === 'close') {
      config.setCloseDragY(deltaY)
      return
    }

    if (gesturePhase.value === 'pan') {
      const targetPan = {
        x: pointerSession.startPan.x + deltaX,
        y: pointerSession.startPan.y + deltaY,
      }
      config.setPanzoomImmediate(
        config.panzoomMotion.scale,
        config.clampPanWithResistance(targetPan, config.panzoomMotion.scale),
        false,
      )
    }
  }

  async function onMediaPointerUp(event: PointerEvent) {
    const wasPinching = gesturePhase.value === 'pinch'
    activePointers.delete(event.pointerId)

    if (wasPinching) {
      releasePointer(event.pointerId)

      if (activePointers.size >= 2) {
        startPinchGesture()
        return
      }

      const session = pinchSession
      for (const pointer of activePointers.values()) {
        releasePointer(pointer.id)
      }
      resetGestureState()
      event.preventDefault()
      event.stopPropagation()
      if (session?.moved) {
        settlePinchGesture()
      }
      return
    }

    if (!pointerSession || event.pointerId !== pointerSession.id) return

    if (config.isZoomedIn.value || emblaStolen) {
      releasePointer(event.pointerId)
    }

    const session = pointerSession
    const deltaX = event.clientX - session.startX
    const deltaY = event.clientY - session.startY
    const mode = gesturePhase.value

    const { vx: velocityX, vy: velocityY } = velocityTracker.getVelocity()

    resetGestureState()

    if (mode === 'close' || mode === 'pan') {
      event.stopPropagation()
    }

    debug?.log(
      'gestures',
      `pointerUp: mode=${mode} moved=${session.moved} deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} vX=${velocityX.toFixed(3)} vY=${velocityY.toFixed(3)}`,
    )

    if (!session.moved || mode === 'idle') {
      handleTap(event.clientX, event.clientY)
      return
    }

    if (mode === 'close') {
      await config.handleCloseGesture(deltaY, velocityY, config.close)
      return
    }

    if (mode === 'pan') {
      const clampedPan = config.clampPan(
        { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
        config.panzoomMotion.scale,
      )
      config.startPanzoomSpring(config.panzoomMotion.scale, clampedPan, {
        tension: 170,
        friction: 17,
      })
    }
  }

  function onMediaPointerCancel(event: PointerEvent) {
    const wasPinching = gesturePhase.value === 'pinch'
    activePointers.delete(event.pointerId)

    if (wasPinching) {
      settlePinchGesture()
      resetGestureState()
      config.setCloseDragY(0)
      return
    }

    if (!pointerSession || event.pointerId !== pointerSession.id) return

    const wasZoomed = config.isZoomedIn.value || emblaStolen
    resetGestureState()

    if (wasZoomed) {
      config.setPanzoomImmediate(
        config.panzoomMotion.scale,
        config.clampPan(
          { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
          config.panzoomMotion.scale,
        ),
      )
    }
    config.setCloseDragY(0)
  }

  function onWheel(event: WheelEvent) {
    if (!config.lightboxMounted.value || config.animating.value) return

    const now = performance.now()
    const isTrackpad =
      Math.abs(event.deltaY) < 100 && Math.abs(event.deltaX) < 100
    // Trackpads emit a dense stream of tiny deltas; wheels are chunkier and can be handled more eagerly.
    const throttleMs = isTrackpad
      ? TRACKPAD_WHEEL_THROTTLE_MS
      : MOUSE_WHEEL_THROTTLE_MS

    if (now - lastWheelTime < throttleMs) {
      event.preventDefault()
      return
    }

    lastWheelTime = now
    event.preventDefault()
    debug?.log(
      'zoom',
      `wheel: deltaY=${event.deltaY.toFixed(1)} isTrackpad=${isTrackpad}`,
    )
    config.applyWheelZoom(event)
  }

  function onKeydown(event: KeyboardEvent) {
    if (!config.lightboxMounted.value || config.animating.value) return

    if (event.key === 'Escape') {
      debug?.log('gestures', 'key: Escape → close')
      void config.close()
      return
    }

    if (event.key === 'z' || event.key === 'Z') {
      debug?.log('gestures', 'key: Z → toggleZoom')
      config.toggleZoom()
      return
    }

    if (event.key === 'ArrowRight') {
      if (config.isZoomedIn.value) {
        config.setPanzoomImmediate(
          config.panzoomMotion.scale,
          config.clampPan(
            { x: config.panzoomMotion.x - 80, y: config.panzoomMotion.y },
            config.panzoomMotion.scale,
          ),
        )
      } else if (!(config.transitionInProgress?.value ?? false)) {
        config.goToNext()
      }
    }

    if (event.key === 'ArrowLeft') {
      if (config.isZoomedIn.value) {
        config.setPanzoomImmediate(
          config.panzoomMotion.scale,
          config.clampPan(
            { x: config.panzoomMotion.x + 80, y: config.panzoomMotion.y },
            config.panzoomMotion.scale,
          ),
        )
      } else if (!(config.transitionInProgress?.value ?? false)) {
        config.goToPrev()
      }
    }
  }

  return {
    gesturePhase,
    resetGestureState,
    cancelTapTimer,
    onMediaPointerDown,
    onMediaPointerMove,
    onMediaPointerUp,
    onMediaPointerCancel,
    onWheel,
    onKeydown,
  }
}
