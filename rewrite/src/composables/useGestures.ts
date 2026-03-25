import { ref, type ComputedRef, type Ref } from 'vue'
import type { AreaMetrics, GestureMode, PanState, PanzoomMotion, Photo, PointerSession, ZoomState } from '../types'
import type { DebugLogger } from './useDebug'

export type GestureConfig = {
  lightboxMounted: Ref<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  mediaAreaRef: Ref<HTMLElement | null>
  currentPhoto: ComputedRef<Photo>
  areaMetrics: Ref<AreaMetrics | null>
  uiVisible: Ref<boolean>
  panState: Ref<PanState>
  zoomState: Ref<ZoomState>
  slideDragOffset: Ref<number>
  closeDragY: Ref<number>
  controlsDisabled: ComputedRef<boolean>

  panzoomMotion: PanzoomMotion
  setPanzoomImmediate: (scale: number, pan: PanState, syncRefs?: boolean) => void
  startPanzoomSpring: (targetScale: number, targetPan: PanState, options?: { tension?: number; friction?: number }) => void
  clampPan: (pan: PanState, zoom?: number, photo?: Photo) => PanState
  clampPanWithResistance: (pan: PanState, zoom?: number, photo?: Photo) => PanState
  applyWheelZoom: (event: WheelEvent) => void
  toggleZoom: (clientPoint?: { x: number; y: number }) => void
  getPanBounds: (photo: Photo, zoom: number) => { x: number; y: number }

  commitSlideChange: (direction: number) => Promise<void>
  resolveSlideTarget: (dragDelta: number, velocityX: number) => number
  animateSlideTo: (targetOffset: number, duration?: number) => Promise<void>

  handleCloseGesture: (deltaY: number, velocityY: number, closeFn: () => Promise<void>) => Promise<void>
  close: () => Promise<void>
}

export function useGestures(config: GestureConfig, debug?: DebugLogger) {
  const gesturePhase = ref<GestureMode>('idle')

  let pointerSession: PointerSession | null = null
  let tapTimer: ReturnType<typeof setTimeout> | undefined
  let lastTap: { time: number; clientX: number; clientY: number } | null = null
  let lastWheelTime = 0

  function resetGestureState() {
    gesturePhase.value = 'idle'
    pointerSession = null
  }

  function cancelTapTimer() {
    if (tapTimer) {
      clearTimeout(tapTimer)
      tapTimer = undefined
    }
  }

  function handleTap(clientX: number, clientY: number) {
    const now = performance.now()
    const isDoubleTap = lastTap
      && now - lastTap.time < 260
      && Math.abs(clientX - lastTap.clientX) < 24
      && Math.abs(clientY - lastTap.clientY) < 24

    cancelTapTimer()

    if (isDoubleTap) {
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
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const threshold = pointerType === 'touch' ? 10 : 6

    if (absX < threshold && absY < threshold) return 'idle'

    const horizontalIntent = absX > absY * 1.1
    const verticalIntent = absY > absX * 1.1

    if (config.isZoomedIn.value) {
      const bounds = config.getPanBounds(config.currentPhoto.value, config.zoomState.value.current)
      const canPanX = bounds.x > 0.5
      const canPanY = bounds.y > 0.5
      const atLeftEdge = config.panState.value.x >= bounds.x - 1
      const atRightEdge = config.panState.value.x <= -bounds.x + 1
      const wantsOutwardSlide = horizontalIntent
        && (!canPanX || (deltaX > 0 && atLeftEdge) || (deltaX < 0 && atRightEdge))

      if (!wantsOutwardSlide && (canPanX || canPanY)) return 'pan'
      if (horizontalIntent) return 'slide'
      return 'pan'
    }

    if (horizontalIntent) return 'slide'
    if (verticalIntent) return 'close'
    return absX >= absY ? 'slide' : 'close'
  }

  function onMediaPointerDown(event: PointerEvent) {
    if (!config.lightboxMounted.value || config.animating.value || config.ghostVisible.value) return
    if (event.pointerType === 'mouse' && event.button !== 0) return

    cancelTapTimer()

    pointerSession = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocityX: 0,
      velocityY: 0,
      moved: false,
      startPan: {
        x: config.panzoomMotion.x,
        y: config.panzoomMotion.y,
      },
    }

    gesturePhase.value = 'idle'
    config.mediaAreaRef.value?.setPointerCapture(event.pointerId)
  }

  function onMediaPointerMove(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id || config.animating.value) return

    const deltaX = event.clientX - pointerSession.startX
    const deltaY = event.clientY - pointerSession.startY
    const elapsed = Math.max(1, event.timeStamp - pointerSession.lastTime)

    pointerSession.velocityX = (event.clientX - pointerSession.lastX) / elapsed
    pointerSession.velocityY = (event.clientY - pointerSession.lastY) / elapsed
    pointerSession.lastX = event.clientX
    pointerSession.lastY = event.clientY
    pointerSession.lastTime = event.timeStamp
    pointerSession.moved = pointerSession.moved || Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4

    if (gesturePhase.value === 'idle') {
      const mode = classifyGesture(deltaX, deltaY, pointerSession.pointerType)
      if (mode !== 'idle') {
        debug?.log('gestures', `classified: ${mode} (deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} pointer=${pointerSession.pointerType})`)
        gesturePhase.value = mode
      }
    }

    if (gesturePhase.value === 'slide') {
      config.slideDragOffset.value = deltaX
      return
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

    try {
      config.mediaAreaRef.value?.releasePointerCapture(event.pointerId)
    } catch {
      // ignored
    }

    const session = pointerSession
    const deltaX = event.clientX - session.startX
    const deltaY = event.clientY - session.startY
    const velocityX = session.velocityX
    const velocityY = session.velocityY
    const mode = gesturePhase.value

    resetGestureState()

    debug?.log('gestures', `pointerUp: mode=${mode} moved=${session.moved} deltaX=${deltaX.toFixed(1)} deltaY=${deltaY.toFixed(1)} vX=${velocityX.toFixed(3)} vY=${velocityY.toFixed(3)}`)

    if (!session.moved || mode === 'idle') {
      handleTap(event.clientX, event.clientY)
      return
    }

    if (mode === 'slide') {
      await handleSlideGesture(deltaX, velocityX)
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

  async function handleSlideGesture(deltaX: number, velocityX: number) {
    const direction = config.resolveSlideTarget(deltaX, velocityX)
    debug?.log('gestures', `slideGesture: deltaX=${deltaX.toFixed(1)} vX=${velocityX.toFixed(3)} → direction=${direction}`)

    config.animating.value = true
    try {
      if (!direction) {
        await config.animateSlideTo(0, 200)
      } else {
        await config.commitSlideChange(direction)
      }
    } finally {
      config.animating.value = false
    }
  }

  function onMediaPointerCancel(event: PointerEvent) {
    if (!pointerSession || event.pointerId !== pointerSession.id) return

    resetGestureState()
    config.setPanzoomImmediate(
      config.panzoomMotion.scale,
      config.clampPan(
        { x: config.panzoomMotion.x, y: config.panzoomMotion.y },
        config.panzoomMotion.scale,
      ),
    )
    config.closeDragY.value = 0
    config.slideDragOffset.value = 0
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
      } else if (!config.controlsDisabled.value) {
        config.animating.value = true
        void config.commitSlideChange(1).catch(() => {}).finally(() => {
          config.animating.value = false
        })
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
      } else if (!config.controlsDisabled.value) {
        config.animating.value = true
        void config.commitSlideChange(-1).catch(() => {}).finally(() => {
          config.animating.value = false
        })
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
