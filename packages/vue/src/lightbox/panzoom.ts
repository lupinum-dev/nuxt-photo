import {
  computed,
  onBeforeUnmount,
  type ComputedRef,
  type Ref,
  type ComponentPublicInstance,
  ref,
} from 'vue'
import {
  computeZoomLevels as coreComputeZoomLevels,
  computePanBounds,
  clampPanToBounds,
  clampPanWithResistance as coreClampPanWithResistance,
  clientToAreaPoint,
  computeTargetPanForZoom,
  type AreaMetrics,
  type PanBounds,
  type PanState,
  type ResolvedPhotoItem as PhotoItem,
  type RectLike,
  type ZoomState,
} from '../core/index'

/**
 * Manage zoom state, pan bounds, and spring-driven transform updates for the
 * currently active slide.
 */
export function usePanzoom(
  currentPhoto: ComputedRef<PhotoItem | null>,
  areaMetrics: Ref<AreaMetrics | null>,
  minZoom: number | undefined,
  /** The photo's drawn size at fit; the lightbox mat makes it smaller than the area. */
  getFrameRect: (photo: PhotoItem) => RectLike | null,
) {
  const flat = (): ZoomState => ({ fit: 1, secondary: 1, max: 1, current: 1 })
  const zoomState = ref(flat())
  const panState = ref<PanState>({ x: 0, y: 0 })

  let activeSlideIndex = 0
  const slideZoomRefs = new Map<number, HTMLElement>()

  /** Where the transform is, where its spring goes and how fast it moves, per axis. */
  const AXES = ['scale', 'x', 'y'] as const
  const now = { x: 0, y: 0, scale: 1 }
  const target = { x: 0, y: 0, scale: 1 }
  const velocity = { x: 0, y: 0, scale: 0 }
  /** A spring at rest is done within this distance and speed, per axis. */
  const REST = { scale: [0.001, 0.001], x: [0.35, 0.08], y: [0.35, 0.08] } as const
  let tension = 170
  let friction = 17
  let rafId = 0

  const isZoomedIn = computed(() => zoomState.value.current > zoomState.value.fit + 0.01)
  const zoomAllowed = computed(() => zoomState.value.max > zoomState.value.fit + 0.05)

  function computeZoomLevels(photo: PhotoItem | null): ZoomState {
    const frame = photo && getFrameRect(photo)
    if (!photo || !frame || frame.width <= 0 || frame.height <= 0) return flat()
    return coreComputeZoomLevels(photo.width, photo.height, frame.width, frame.height, { minZoom })
  }

  /** Where the fitted frame's center sits relative to the area's center. */
  function getFrameOffset(photo: PhotoItem): PanState {
    const area = areaMetrics.value
    const frame = getFrameRect(photo)
    if (!area || !frame) return { x: 0, y: 0 }
    return {
      x: frame.left + frame.width / 2 - area.width / 2,
      y: frame.top + frame.height / 2 - area.height / 2,
    }
  }

  function getPanBounds(photo: PhotoItem, zoom: number): PanBounds {
    const area = areaMetrics.value
    const frame = getFrameRect(photo)
    if (!area || !frame) return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    return computePanBounds(frame, area, zoom, getFrameOffset(photo))
  }

  const clamper =
    (clamp: (pan: PanState, bounds: PanBounds) => PanState) =>
    (pan: PanState, zoom = zoomState.value.current, photo = currentPhoto.value): PanState =>
      photo ? clamp(pan, getPanBounds(photo, zoom)) : { x: 0, y: 0 }
  const clampPan = clamper(clampPanToBounds)
  const clampPanWithResistance = clamper(coreClampPanWithResistance)

  function getPointFromClient(clientX: number, clientY: number) {
    const area = areaMetrics.value
    if (!area) return { x: 0, y: 0 }
    return clientToAreaPoint(clientX, clientY, area.left, area.top, area.width, area.height)
  }

  function getTargetPanForZoom(targetZoom: number, clientPoint?: { x: number; y: number }) {
    const photo = currentPhoto.value
    if (!photo) return { x: 0, y: 0 }

    const point = clientPoint ? getPointFromClient(clientPoint.x, clientPoint.y) : { x: 0, y: 0 }
    const bounds = getPanBounds(photo, targetZoom)

    return computeTargetPanForZoom(
      targetZoom,
      now.scale,
      { x: now.x, y: now.y },
      point,
      zoomState.value.fit,
      bounds,
      getFrameOffset(photo),
    )
  }

  function applyActivePanzoomTransform() {
    const activeZoomElement = slideZoomRefs.get(activeSlideIndex)
    if (!activeZoomElement) return
    activeZoomElement.style.transform = `translate3d(${now.x}px, ${now.y}px, 0) scale(${now.scale})`
  }

  function stopPanzoomSpring() {
    if (!rafId) return
    cancelAnimationFrame(rafId)
    rafId = 0
  }

  function syncPanzoomRefs(scale = now.scale, pan: PanState = { x: now.x, y: now.y }) {
    zoomState.value = { ...zoomState.value, current: scale }
    panState.value = { ...pan }
  }

  function setPanzoomImmediate(scale: number, pan: PanState, syncRefs = true) {
    stopPanzoomSpring()
    Object.assign(now, { scale, x: pan.x, y: pan.y })
    Object.assign(target, now)
    Object.assign(velocity, { scale: 0, x: 0, y: 0 })

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
    Object.assign(target, { scale: targetScale, x: targetPan.x, y: targetPan.y })
    tension = options?.tension ?? 170
    friction = options?.friction ?? 17

    syncPanzoomRefs(targetScale, targetPan)

    if (rafId) return

    let lastTime = performance.now()

    const step = (time: number) => {
      const dt = Math.min(0.064, (time - lastTime) / 1000)
      lastTime = time

      let done = true
      for (const axis of AXES) {
        const distance = target[axis] - now[axis]
        velocity[axis] += (distance * tension - velocity[axis] * friction) * dt
        now[axis] += velocity[axis] * dt
        const [near, slow] = REST[axis]
        done &&= Math.abs(distance) < near && Math.abs(velocity[axis]) < slow
      }

      applyActivePanzoomTransform()

      if (done) {
        Object.assign(now, target)
        applyActivePanzoomTransform()
        rafId = 0
        syncPanzoomRefs()
        return
      }

      rafId = requestAnimationFrame(step)
    }

    rafId = requestAnimationFrame(step)
  }

  function refreshZoomState(reset = false) {
    const photo = currentPhoto.value
    const next = computeZoomLevels(photo)
    const current = reset ? next.fit : Math.min(next.max, Math.max(next.fit, target.scale))
    const nextPan =
      current <= next.fit + 0.01
        ? { x: 0, y: 0 }
        : clampPan({ x: target.x, y: target.y }, current, photo ?? undefined)

    zoomState.value = {
      fit: next.fit,
      secondary: next.secondary,
      max: next.max,
      current,
    }
    panState.value = nextPan
    setPanzoomImmediate(current, nextPan, false)
  }

  function toggleZoom(clientPoint?: { x: number; y: number }) {
    if (!zoomAllowed.value) return

    const targetZoom = isZoomedIn.value ? zoomState.value.fit : zoomState.value.secondary
    const targetPan = getTargetPanForZoom(targetZoom, clientPoint)
    startPanzoomSpring(targetZoom, targetPan)
  }

  function applyWheelZoom(event: WheelEvent) {
    if (!zoomAllowed.value) return

    const direction = Math.max(Math.min(-event.deltaY, 1), -1)
    if (direction === 0) return
    const zoomFactor = direction > 0 ? 1.5 : 0.5

    const targetZoom = Math.min(
      zoomState.value.max,
      Math.max(zoomState.value.fit, now.scale * zoomFactor),
    )
    if (targetZoom === now.scale) return

    const targetPan = getTargetPanForZoom(targetZoom, {
      x: event.clientX,
      y: event.clientY,
    })

    startPanzoomSpring(targetZoom, targetPan)
  }

  /** Whether a screen point lands on the active photo as currently drawn, zoom included. */
  function isPointOnPhoto(clientX: number, clientY: number) {
    const element = slideZoomRefs.get(activeSlideIndex)
    if (!element) return false
    const rect = element.getBoundingClientRect()
    return (
      clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
    )
  }

  function setActiveSlideIndex(index: number) {
    activeSlideIndex = index
  }

  function getCurrentScale() {
    return now.scale
  }

  function getCurrentPan(): PanState {
    return { x: now.x, y: now.y }
  }

  function setCurrentPanImmediate(pan: PanState, syncRefs = false) {
    setPanzoomImmediate(now.scale, pan, syncRefs)
  }

  function settleCurrentTransform() {
    startPanzoomSpring(now.scale, clampPan(getCurrentPan(), now.scale))
  }

  function setSlideZoomRef(slideIndex: number) {
    return (value: Element | ComponentPublicInstance | null) => {
      const element =
        value instanceof HTMLElement
          ? value
          : value && '$el' in value && value.$el instanceof HTMLElement
            ? value.$el
            : null

      if (element) {
        slideZoomRefs.set(slideIndex, element)
        if (slideIndex === activeSlideIndex) {
          applyActivePanzoomTransform()
        } else {
          element.style.transform = 'translate3d(0px, 0px, 0) scale(1)'
        }
        return
      }

      slideZoomRefs.delete(slideIndex)
    }
  }

  onBeforeUnmount(stopPanzoomSpring)

  return {
    zoomState,
    panState,
    isZoomedIn,
    zoomAllowed,
    setActiveSlideIndex,
    setSlideZoomRef,
    getPanBounds,
    getFrameOffset,
    clampPan,
    clampPanWithResistance,
    getTargetPanForZoom,
    setPanzoomImmediate,
    startPanzoomSpring,
    refreshZoomState,
    toggleZoom,
    applyWheelZoom,
    isPointOnPhoto,
    getCurrentScale,
    getCurrentPan,
    setCurrentPanImmediate,
    settleCurrentTransform,
  }
}
