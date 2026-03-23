import { equalizePoints, getDistanceBetween, pointsEqual } from '../utils/math'
import type {
  AnimationsInstance,
  DOMEventsInstance,
  GesturesInstance,
  MainScrollInstance,
  OpenerInstance,
  LightboxEvent,
  LightboxInstance,
  Point,
  PreparedLightboxOptions,
  SlideInstance,
} from '../types'
import { createDragHandler } from './createDragHandler'
import { createTapHandler } from './createTapHandler'
import { createZoomHandler } from './createZoomHandler'

const AXIS_SWIPE_HYSTERISIS = 10
const DOUBLE_TAP_DELAY = 300
const MIN_TAP_DISTANCE = 25

export interface GestureState {
  dragAxis: GesturesInstance['dragAxis']
  p1: Point
  p2: Point
  prevP1: Point
  prevP2: Point
  startP1: Point
  startP2: Point
  velocity: Point
  supportsTouch: boolean
  isMultitouch: boolean
  isDragging: boolean
  isZooming: boolean
  raf: number | null
}

export interface GestureDeps {
  options: PreparedLightboxOptions
  offset: Point
  viewportSize: Point
  events: DOMEventsInstance
  animations: Pick<AnimationsInstance, 'stopAll' | 'stopAllPan' | 'startSpring'>
  mainScroll: MainScrollInstance
  dispatch<T extends string>(name: T, details?: Record<string, unknown>): LightboxEvent<T>
  applyFilters<T extends string>(name: T, ...args: unknown[]): unknown
  getCurrSlide(): SlideInstance | undefined
  getOpener(): OpenerInstance
  getScrollWrap(): HTMLElement | undefined
  getElement(): HTMLDivElement | undefined
  getBgOpacity(): number
  getInstance(): LightboxInstance
  onBindEvents(fn: () => void): void
  mouseDetected(): void
  setUIVisible(isVisible: boolean): void
  close(): void
  next(): void
  applyBgOpacity(opacity: number): void
}

export function createGestures(deps: GestureDeps): GesturesInstance {
  const touchEventEnabled = typeof window !== 'undefined' && 'ontouchstart' in window
  const pointerEventEnabled = typeof window !== 'undefined' && !!window.PointerEvent
  const supportsTouch = touchEventEnabled || (pointerEventEnabled && navigator.maxTouchPoints > 1)

  let numActivePoints = 0
  const ongoingPointers: Point[] = []
  let intervalTime = 0
  let velocityCalculated = false
  const lastStartP1: Point = { x: 0, y: 0 }
  const intervalP1: Point = { x: 0, y: 0 }
  let tapTimer: ReturnType<typeof setTimeout> | null = null

  if (!supportsTouch) {
    deps.options.allowPanToNext = false
  }

  const state: GestureState = {
    dragAxis: null,
    p1: { x: 0, y: 0 },
    p2: { x: 0, y: 0 },
    prevP1: { x: 0, y: 0 },
    prevP2: { x: 0, y: 0 },
    startP1: { x: 0, y: 0 },
    startP2: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    supportsTouch,
    isMultitouch: false,
    isDragging: false,
    isZooming: false,
    raf: null,
  }

  const zoomHandler = createZoomHandler({ state, deps })
  const dragHandler = createDragHandler({
    state,
    deps,
    getZoomHandler: () => zoomHandler,
  })
  const tapHandler = createTapHandler({ state, deps })

  const gestures = Object.assign(state, {
    drag: dragHandler,
    zoomLevels: zoomHandler,
    tapHandler,
  }) as Omit<GesturesInstance, 'lightbox'>

  Object.defineProperty(gestures, 'lightbox', {
    enumerable: true,
    get: deps.getInstance,
  })

  function clearTapTimer(): void {
    if (tapTimer) {
      clearTimeout(tapTimer)
      tapTimer = null
    }
  }

  function updatePrevPoints(): void {
    equalizePoints(state.prevP1, state.p1)
    equalizePoints(state.prevP2, state.p2)
  }

  function updateStartPoints(): void {
    equalizePoints(state.startP1, state.p1)
    equalizePoints(state.startP2, state.p2)
    updatePrevPoints()
  }

  function convertEventPosToPoint(e: Touch | PointerEvent, p: Point): Point {
    p.x = e.pageX - deps.offset.x
    p.y = e.pageY - deps.offset.y
    if ('pointerId' in e) {
      p.id = e.pointerId
    }
    else if ((e as Touch).identifier !== undefined) {
      p.id = (e as Touch).identifier
    }
    return p
  }

  function updatePoints(e: PointerEvent | TouchEvent, pointerType: 'up' | 'down' | 'move'): void {
    if (pointerEventEnabled) {
      const pe = e as PointerEvent
      const idx = ongoingPointers.findIndex(p => p.id === pe.pointerId)

      if (pointerType === 'up' && idx > -1) {
        ongoingPointers.splice(idx, 1)
      }
      else if (pointerType === 'down' && idx === -1) {
        ongoingPointers.push(convertEventPosToPoint(pe, { x: 0, y: 0 }))
      }
      else if (idx > -1 && ongoingPointers[idx]) {
        convertEventPosToPoint(pe, ongoingPointers[idx])
      }

      numActivePoints = ongoingPointers.length
      if (numActivePoints > 0 && ongoingPointers[0]) equalizePoints(state.p1, ongoingPointers[0])
      if (numActivePoints > 1 && ongoingPointers[1]) equalizePoints(state.p2, ongoingPointers[1])
    }
    else {
      const te = e as TouchEvent
      numActivePoints = 0
      if (te.type.includes('touch')) {
        if (te.touches?.length > 0) {
          if (te.touches[0]) {
            convertEventPosToPoint(te.touches[0], state.p1)
          }
          numActivePoints++
          if (te.touches.length > 1 && te.touches[1]) {
            convertEventPosToPoint(te.touches[1], state.p2)
            numActivePoints++
          }
        }
      }
      else {
        convertEventPosToPoint(e as PointerEvent, state.p1)
        if (pointerType === 'up') {
          numActivePoints = 0
        }
        else {
          numActivePoints++
        }
      }
    }
  }

  function getVelocity(axis: 'x' | 'y', duration: number): number {
    const displacement = state.p1[axis] - intervalP1[axis]
    if (Math.abs(displacement) > 1 && duration > 5) {
      return displacement / duration
    }
    return 0
  }

  function updateVelocity(force?: boolean): void {
    const time = Date.now()
    const duration = time - intervalTime
    if (duration < 50 && !force) return

    state.velocity.x = getVelocity('x', duration)
    state.velocity.y = getVelocity('y', duration)
    intervalTime = time
    equalizePoints(intervalP1, state.p1)
    velocityCalculated = true
  }

  function calculateDragDirection(): void {
    if (deps.mainScroll.isShifted()) {
      state.dragAxis = 'x'
    }
    else {
      const diff = Math.abs(state.p1.x - state.startP1.x) - Math.abs(state.p1.y - state.startP1.y)
      if (diff !== 0) {
        const axisToCheck = diff > 0 ? 'x' : 'y'
        if (Math.abs(state.p1[axisToCheck] - state.startP1[axisToCheck]) >= AXIS_SWIPE_HYSTERISIS) {
          state.dragAxis = axisToCheck
        }
      }
    }
  }

  function preventPointerEventBehaviour(e: PointerEvent, pointerType: string): void {
    const preventPointerEvent = deps.applyFilters('preventPointerEvent', true, e, pointerType)
    if (preventPointerEvent) {
      e.preventDefault()
    }
  }

  function finishDrag(): void {
    if (state.isDragging) {
      state.isDragging = false
      if (!velocityCalculated) {
        updateVelocity(true)
      }
      dragHandler.end()
      state.dragAxis = null
    }
  }

  function rafStopLoop(): void {
    if (state.raf) {
      cancelAnimationFrame(state.raf)
      state.raf = null
    }
  }

  function rafRenderLoop(): void {
    if (state.isDragging || state.isZooming) {
      updateVelocity()

      if (state.isDragging) {
        if (!pointsEqual(state.p1, state.prevP1)) {
          dragHandler.change()
        }
      }
      else if (!pointsEqual(state.p1, state.prevP1) || !pointsEqual(state.p2, state.prevP2)) {
        zoomHandler.change()
      }

      updatePrevPoints()
      state.raf = requestAnimationFrame(rafRenderLoop)
    }
  }

  function finishTap(e: PointerEvent): void {
    if (deps.mainScroll.isShifted()) {
      deps.mainScroll.moveIndexBy(0, true)
      return
    }

    if (e.type.indexOf('cancel') > 0) return

    if (e.type === 'mouseup' || e.pointerType === 'mouse') {
      tapHandler.click(state.startP1, e)
      return
    }

    const tapDelay = deps.options.doubleTapAction ? DOUBLE_TAP_DELAY : 0

    if (tapTimer) {
      clearTapTimer()
      if (getDistanceBetween(lastStartP1, state.startP1) < MIN_TAP_DISTANCE) {
        tapHandler.doubleTap(state.startP1, e)
      }
    }
    else {
      equalizePoints(lastStartP1, state.startP1)
      tapTimer = setTimeout(() => {
        tapHandler.tap(state.startP1, e)
        clearTapTimer()
      }, tapDelay)
    }
  }

  function onPointerDown(e: PointerEvent): void {
    const isMousePointer = e.type === 'mousedown' || e.pointerType === 'mouse'

    if (isMousePointer && e.button > 0) return

    if (!deps.getOpener().isOpen) {
      e.preventDefault()
      return
    }

    if (deps.dispatch('pointerDown', { originalEvent: e }).defaultPrevented) return

    if (isMousePointer) {
      deps.mouseDetected()
      preventPointerEventBehaviour(e, 'down')
    }

    deps.animations.stopAll()
    updatePoints(e, 'down')

    if (numActivePoints === 1) {
      state.dragAxis = null
      equalizePoints(state.startP1, state.p1)
    }

    if (numActivePoints > 1) {
      clearTapTimer()
      state.isMultitouch = true
    }
    else {
      state.isMultitouch = false
    }
  }

  function onPointerMove(e: PointerEvent): void {
    preventPointerEventBehaviour(e, 'move')
    if (!numActivePoints) return

    updatePoints(e, 'move')

    if (deps.dispatch('pointerMove', { originalEvent: e }).defaultPrevented) return

    if (numActivePoints === 1 && !state.isDragging) {
      if (!state.dragAxis) {
        calculateDragDirection()
      }

      if (state.dragAxis && !state.isDragging) {
        if (state.isZooming) {
          state.isZooming = false
          zoomHandler.end()
        }

        state.isDragging = true
        clearTapTimer()
        updateStartPoints()
        intervalTime = Date.now()
        velocityCalculated = false
        equalizePoints(intervalP1, state.p1)
        state.velocity.x = 0
        state.velocity.y = 0
        dragHandler.start()
        rafStopLoop()
        rafRenderLoop()
      }
    }
    else if (numActivePoints > 1 && !state.isZooming) {
      finishDrag()
      state.isZooming = true
      updateStartPoints()
      zoomHandler.start()
      rafStopLoop()
      rafRenderLoop()
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (!numActivePoints) return
    updatePoints(e, 'up')

    if (deps.dispatch('pointerUp', { originalEvent: e }).defaultPrevented) return

    if (numActivePoints === 0) {
      rafStopLoop()
      if (state.isDragging) {
        finishDrag()
      }
      else if (!state.isZooming && !state.isMultitouch) {
        finishTap(e)
      }
    }

    if (numActivePoints < 2 && state.isZooming) {
      state.isZooming = false
      zoomHandler.end()
      if (numActivePoints === 1) {
        state.dragAxis = null
        updateStartPoints()
      }
    }
  }

  function onClick(e: MouseEvent): void {
    if (deps.mainScroll.isShifted()) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  deps.onBindEvents(() => {
    deps.events.add(deps.getScrollWrap(), 'click', onClick as EventListener)

    if (pointerEventEnabled) {
      deps.events.add(deps.getScrollWrap(), 'pointerdown', onPointerDown as EventListener)
      deps.events.add(window, 'pointermove', onPointerMove as EventListener)
      deps.events.add(window, 'pointerup', onPointerUp as EventListener)
      deps.events.add(deps.getScrollWrap(), 'pointercancel', onPointerUp as EventListener)
    }
    else if (touchEventEnabled) {
      deps.events.add(deps.getScrollWrap(), 'touchstart', onPointerDown as EventListener)
      deps.events.add(window, 'touchmove', onPointerMove as EventListener)
      deps.events.add(window, 'touchend', onPointerUp as EventListener)
      deps.events.add(deps.getScrollWrap(), 'touchcancel', onPointerUp as EventListener)
      const scrollWrap = deps.getScrollWrap()
      if (scrollWrap) {
        scrollWrap.ontouchmove = () => {}
        scrollWrap.ontouchend = () => {}
      }
    }
    else {
      deps.events.add(deps.getScrollWrap(), 'mousedown', onPointerDown as EventListener)
      deps.events.add(window, 'mousemove', onPointerMove as EventListener)
      deps.events.add(window, 'mouseup', onPointerUp as EventListener)
    }
  })

  return gestures as GesturesInstance
}
