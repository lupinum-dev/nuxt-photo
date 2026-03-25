import { computed, type ComputedRef, type Ref, type ComponentPublicInstance } from 'vue'
import { ref } from 'vue'
import type { AreaMetrics, PanState, PanzoomMotion, Photo, ZoomState } from '../types'
import { fitRect, rubberband } from '../utils/geometry'

export function usePanzoom(
  currentPhoto: ComputedRef<Photo>,
  areaMetrics: Ref<AreaMetrics | null>,
) {
  const zoomState = ref<ZoomState>({ fit: 1, secondary: 1, max: 1, current: 1 })
  const panState = ref<PanState>({ x: 0, y: 0 })

  const slideZoomRefs = new Map<-1 | 0 | 1, HTMLElement>()

  const panzoomMotion: PanzoomMotion = {
    x: 0,
    y: 0,
    scale: 1,
    targetX: 0,
    targetY: 0,
    targetScale: 1,
    velocityX: 0,
    velocityY: 0,
    velocityScale: 0,
    tension: 170,
    friction: 17,
    rafId: 0,
  }

  const isZoomedIn = computed(() => zoomState.value.current > zoomState.value.fit + 0.01)
  const zoomAllowed = computed(() => zoomState.value.max > zoomState.value.fit + 0.05)

  function getRelativeFrameRect(photo: Photo, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(
      { left: 0, top: 0, width: area.width, height: area.height },
      photo.width / photo.height,
    )
  }

  function computeZoomLevels(photo: Photo): ZoomState {
    const frame = getRelativeFrameRect(photo)
    if (!frame) {
      return { fit: 1, secondary: 1, max: 1, current: 1 }
    }

    const naturalMax = Math.max(
      1,
      Math.min(4, photo.width / frame.width, photo.height / frame.height),
    )
    const secondary = naturalMax <= 1.05 ? 1 : Math.min(2, naturalMax)

    return {
      fit: 1,
      secondary,
      max: Math.max(secondary, naturalMax),
      current: 1,
    }
  }

  function getPanBounds(photo: Photo, zoom: number) {
    const area = areaMetrics.value
    const frame = getRelativeFrameRect(photo, area)
    if (!area || !frame) {
      return { x: 0, y: 0 }
    }

    return {
      x: Math.max(0, (frame.width * zoom - area.width) / 2),
      y: Math.max(0, (frame.height * zoom - area.height) / 2),
    }
  }

  function clampPan(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
    const bounds = getPanBounds(photo, zoom)
    return {
      x: Math.min(bounds.x, Math.max(-bounds.x, pan.x)),
      y: Math.min(bounds.y, Math.max(-bounds.y, pan.y)),
    }
  }

  function clampPanWithResistance(pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState {
    const bounds = getPanBounds(photo, zoom)
    return {
      x: rubberband(pan.x, -bounds.x, bounds.x),
      y: rubberband(pan.y, -bounds.y, bounds.y),
    }
  }

  function getPointFromClient(clientX: number, clientY: number) {
    const area = areaMetrics.value
    if (!area) return { x: 0, y: 0 }
    return {
      x: clientX - area.left - area.width / 2,
      y: clientY - area.top - area.height / 2,
    }
  }

  function getTargetPanForZoom(targetZoom: number, clientPoint?: { x: number; y: number }) {
    if (targetZoom <= zoomState.value.fit + 0.01) {
      return { x: 0, y: 0 }
    }

    const point = clientPoint ? getPointFromClient(clientPoint.x, clientPoint.y) : { x: 0, y: 0 }
    const currentZoom = panzoomMotion.scale
    const currentPan = { x: panzoomMotion.x, y: panzoomMotion.y }

    const targetPan = {
      x: point.x - ((point.x - currentPan.x) / currentZoom) * targetZoom,
      y: point.y - ((point.y - currentPan.y) / currentZoom) * targetZoom,
    }

    return clampPan(targetPan, targetZoom)
  }

  function applyActivePanzoomTransform() {
    const activeZoomElement = slideZoomRefs.get(0)
    if (!activeZoomElement) return
    activeZoomElement.style.transform = `translate3d(${panzoomMotion.x}px, ${panzoomMotion.y}px, 0) scale(${panzoomMotion.scale})`
  }

  function stopPanzoomSpring() {
    if (!panzoomMotion.rafId) return
    cancelAnimationFrame(panzoomMotion.rafId)
    panzoomMotion.rafId = 0
  }

  function syncPanzoomRefs(scale = panzoomMotion.scale, pan: PanState = { x: panzoomMotion.x, y: panzoomMotion.y }) {
    zoomState.value = { ...zoomState.value, current: scale }
    panState.value = { ...pan }
  }

  function setPanzoomImmediate(scale: number, pan: PanState, syncRefs = true) {
    stopPanzoomSpring()

    panzoomMotion.scale = scale
    panzoomMotion.targetScale = scale
    panzoomMotion.x = pan.x
    panzoomMotion.y = pan.y
    panzoomMotion.targetX = pan.x
    panzoomMotion.targetY = pan.y
    panzoomMotion.velocityScale = 0
    panzoomMotion.velocityX = 0
    panzoomMotion.velocityY = 0

    applyActivePanzoomTransform()

    if (syncRefs) {
      syncPanzoomRefs(scale, pan)
    }
  }

  function startPanzoomSpring(
    targetScale: number,
    targetPan: PanState,
    options?: { tension?: number; friction?: number },
  ) {
    panzoomMotion.targetScale = targetScale
    panzoomMotion.targetX = targetPan.x
    panzoomMotion.targetY = targetPan.y
    panzoomMotion.tension = options?.tension ?? 170
    panzoomMotion.friction = options?.friction ?? 17

    syncPanzoomRefs(targetScale, targetPan)

    if (panzoomMotion.rafId) return

    let lastTime = performance.now()

    const step = (now: number) => {
      const dt = Math.min(0.064, (now - lastTime) / 1000)
      lastTime = now

      const scaleDistance = panzoomMotion.targetScale - panzoomMotion.scale
      const xDistance = panzoomMotion.targetX - panzoomMotion.x
      const yDistance = panzoomMotion.targetY - panzoomMotion.y

      const spring = panzoomMotion.tension
      const damping = panzoomMotion.friction

      panzoomMotion.velocityScale += (scaleDistance * spring - panzoomMotion.velocityScale * damping) * dt
      panzoomMotion.velocityX += (xDistance * spring - panzoomMotion.velocityX * damping) * dt
      panzoomMotion.velocityY += (yDistance * spring - panzoomMotion.velocityY * damping) * dt

      panzoomMotion.scale += panzoomMotion.velocityScale * dt
      panzoomMotion.x += panzoomMotion.velocityX * dt
      panzoomMotion.y += panzoomMotion.velocityY * dt

      applyActivePanzoomTransform()

      const done = Math.abs(scaleDistance) < 0.001
        && Math.abs(xDistance) < 0.35
        && Math.abs(yDistance) < 0.35
        && Math.abs(panzoomMotion.velocityScale) < 0.001
        && Math.abs(panzoomMotion.velocityX) < 0.08
        && Math.abs(panzoomMotion.velocityY) < 0.08

      if (done) {
        panzoomMotion.scale = panzoomMotion.targetScale
        panzoomMotion.x = panzoomMotion.targetX
        panzoomMotion.y = panzoomMotion.targetY
        applyActivePanzoomTransform()
        panzoomMotion.rafId = 0
        syncPanzoomRefs()
        return
      }

      panzoomMotion.rafId = requestAnimationFrame(step)
    }

    panzoomMotion.rafId = requestAnimationFrame(step)
  }

  function refreshZoomState(reset = false) {
    const next = computeZoomLevels(currentPhoto.value)
    const current = reset
      ? next.fit
      : Math.min(next.max, Math.max(next.fit, panzoomMotion.targetScale))
    const nextPan = current <= next.fit + 0.01
      ? { x: 0, y: 0 }
      : clampPan(
          { x: panzoomMotion.targetX, y: panzoomMotion.targetY },
          current,
          currentPhoto.value,
        )

    zoomState.value = { fit: next.fit, secondary: next.secondary, max: next.max, current }
    panState.value = nextPan
    setPanzoomImmediate(current, nextPan, false)
  }

  function toggleZoom(clientPoint?: { x: number; y: number }) {
    if (!zoomAllowed.value) return

    const targetZoom = isZoomedIn.value ? zoomState.value.fit : zoomState.value.secondary
    const targetPan = getTargetPanForZoom(targetZoom, clientPoint)
    startPanzoomSpring(targetZoom, targetPan, { tension: 170, friction: 17 })
  }

  function applyWheelZoom(event: WheelEvent) {
    if (!zoomAllowed.value) return

    const direction = Math.max(Math.min(-event.deltaY, 1), -1)
    if (direction === 0) return
    const zoomFactor = direction > 0 ? 1.5 : 0.5

    const targetZoom = Math.min(
      zoomState.value.max,
      Math.max(zoomState.value.fit, panzoomMotion.scale * zoomFactor),
    )
    if (targetZoom === panzoomMotion.scale) return

    const targetPan = getTargetPanForZoom(targetZoom, {
      x: event.clientX,
      y: event.clientY,
    })

    startPanzoomSpring(targetZoom, targetPan, { tension: 170, friction: 17 })
  }

  function setSlideZoomRef(offset: -1 | 0 | 1) {
    return (value: Element | ComponentPublicInstance | null) => {
      const element = value instanceof HTMLElement
        ? value
        : value && '$el' in value && value.$el instanceof HTMLElement
          ? value.$el
          : null

      if (element instanceof HTMLElement) {
        slideZoomRefs.set(offset, element)
        if (offset === 0) {
          applyActivePanzoomTransform()
        } else {
          element.style.transform = 'translate3d(0px, 0px, 0) scale(1)'
        }
        return
      }

      slideZoomRefs.delete(offset)
    }
  }

  return {
    zoomState,
    panState,
    isZoomedIn,
    zoomAllowed,
    panzoomMotion,

    setSlideZoomRef,
    computeZoomLevels,
    getPanBounds,
    clampPan,
    clampPanWithResistance,
    getPointFromClient,
    getTargetPanForZoom,
    applyActivePanzoomTransform,
    stopPanzoomSpring,
    setPanzoomImmediate,
    startPanzoomSpring,
    refreshZoomState,
    toggleZoom,
    applyWheelZoom,
  }
}
