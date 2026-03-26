import { ref, type ComputedRef, type Ref } from 'vue'
import {
  classifyGesture as coreClassifyGesture,
  isDoubleTap as coreIsDoubleTap,
  VelocityTracker,
  type AreaMetrics,
  type GestureMode,
  type PanState,
  type PanzoomMotion,
  type PhotoItem,
  type ZoomState,
  type DebugLogger,
} from '@nuxt-photo/core'

export type GestureConfig = {
  lightboxMounted: Ref<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  mediaAreaRef: Ref<HTMLElement | null>
  currentPhoto: ComputedRef<PhotoItem>
  areaMetrics: Ref<AreaMetrics | null>
  uiVisible: Ref<boolean>
  panState: Ref<PanState>
  zoomState: Ref<ZoomState>
  closeDragY: Ref<number>
  transitionInProgress: ComputedRef<boolean>

  panzoomMotion: PanzoomMotion
  setPanzoomImmediate: (scale: number, pan: PanState, syncRefs?: boolean) => void
  startPanzoomSpring: (targetScale: number, targetPan: PanState, options?: { tension?: number; friction?: number }) => void
  clampPan: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
  clampPanWithResistance: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
  applyWheelZoom: (event: WheelEvent) => void
  toggleZoom: (clientPoint?: { x: number; y: number }) => void
  getPanBounds: (photo: PhotoItem, zoom: number) => { x: number; y: number }

  goToNext: () => void
  goToPrev: () => void
  goTo: (index: number, instant?: boolean) => void
  selectedSnap: () => number

  handleCloseGesture: (deltaY: number, velocityY: number, closeFn: () => Promise<void>) => Promise<void>
  close: () => Promise<void>
}

export function useGestures(config: GestureConfig, debug?: DebugLogger) {
  const gesturePhase = ref<GestureMode>('idle')

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

  let tapTimer: ReturnType<typeof setTimeout> | undefined
  let lastTap: { time: number; clientX: number; clientY: number } | null = null
  let lastWheelTime = 0
  let emblaStolen = false

  const velocityTracker = new VelocityTracker(100)

  function resetGestureState() {
    gesturePhase.value = 'idle'
    pointerSession = null
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
      debug?.log('gestures', 'double-tap → toggleZoom at', { x: clientX, y: clientY })
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

  function classifyGesture(deltaX: number, deltaY: number, pointerType: string): GestureMode {
    const bounds = config.getPanBounds(config.currentPhoto.value, config.zoomState.value.current)
    return coreClassifyGesture(
      deltaX,
      deltaY,
      pointerType,
      config.isZoomedIn.value,
      bounds,
      config.panState.value,
    )
  }

  function onMediaPointerDown(event: PointerEvent) {
    if (!config.lightboxMounted.value || config.ghostVisible.value) return

    if (config.animating.value) {
      event.stopPropagation()
      return
    }

    if (event.pointerType === 'mouse' && event.button !== 0) return

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
      config.mediaAreaRef.value?.setPointerCapture(event.pointerId)
    }
  }

  function onMediaPointerMove(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    const deltaX = event.clientX - pointerSession.startX
    const deltaY = event.clientY - pointerSession.startY

    velocityTracker.addSample(event.clientX, event.clientY, event.timeStamp)

    pointerSession.lastX = event.clientX
    pointerSession.lastY = event.clientY
    pointerSession.moved = pointerSession.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (gesturePhase.value === 'idle') {
      const mode = classifyGesture(deltaX, deltaY, pointerSession.pointerType)
      if (mode !== 'idle') {
        debug?.log('gestures', `classified: ${mode} (deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} pointer=${pointerSession.pointerType})`)
        gesturePhase.value = mode

        if (mode === 'close') {
          event.stopPropagation()
          emblaStolen = true
          config.goTo(config.selectedSnap(), true)
          config.mediaAreaRef.value?.setPointerCapture(event.pointerId)
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
      config.closeDragY.value = deltaY
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
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    if (config.isZoomedIn.value || emblaStolen) {
      try {
        config.mediaAreaRef.value?.releasePointerCapture(event.pointerId)
      } catch {
        // ignored
      }
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

    debug?.log('gestures', `pointerUp: mode=${mode} moved=${session.moved} deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} vX=${velocityX.toFixed(3)} vY=${velocityY.toFixed(3)}`)

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
    config.closeDragY.value = 0
  }

  function onWheel(event: WheelEvent) {
    if (!config.lightboxMounted.value || config.animating.value) return

    const now = Date.now()
    const isTrackpad = Math.abs(event.deltaY) < 100 && Math.abs(event.deltaX) < 100
    const throttleMs = isTrackpad ? 200 : 45

    if (now - lastWheelTime < throttleMs) {
      event.preventDefault()
      return
    }

    lastWheelTime = now
    event.preventDefault()
    debug?.log('zoom', `wheel: deltaY=${event.deltaY.toFixed(1)} isTrackpad=${isTrackpad}`)
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
