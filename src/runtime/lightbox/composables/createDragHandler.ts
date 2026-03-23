import { clamp, equalizePoints, roundPoint } from '../utils/math'
import type { DragHandlerInstance } from '../types'
import type { GestureDeps, GestureState } from './createGestures'

const PAN_END_FRICTION = 0.35
const VERTICAL_DRAG_FRICTION = 0.6
const MIN_RATIO_TO_CLOSE = 0.4
const MIN_NEXT_SLIDE_SPEED = 0.5

function project(initialVelocity: number, decelerationRate: number): number {
  return (initialVelocity * decelerationRate) / (1 - decelerationRate)
}

export function createDragHandler({
  state,
  deps,
  getZoomHandler,
}: {
  state: GestureState
  deps: GestureDeps
  getZoomHandler(): { correctZoomPan(ignoreGesture?: boolean): void }
}): DragHandlerInstance {
  const handler: DragHandlerInstance = {
    startPan: { x: 0, y: 0 },

    start() {
      const currSlide = deps.getCurrSlide()
      if (currSlide) {
        equalizePoints(handler.startPan, currSlide.pan)
      }
      deps.animations.stopAll()
    },

    change() {
      const currSlide = deps.getCurrSlide()

      if (
        state.dragAxis === 'y'
        && deps.options.closeOnVerticalDrag
        && currSlide
        && currSlide.currZoomLevel <= currSlide.zoomLevels.fit
        && !state.isMultitouch
      ) {
        const panY = currSlide.pan.y + (state.p1.y - state.prevP1.y)
        if (!deps.dispatch('verticalDrag', { panY }).defaultPrevented) {
          setPanWithFriction('y', panY, VERTICAL_DRAG_FRICTION)
          const bgOpacity = 1 - Math.abs(getVerticalDragRatio(currSlide.pan.y))
          deps.applyBgOpacity(bgOpacity)
          currSlide.applyCurrentZoomPan()
        }
      }
      else {
        const mainScrollChanged = panOrMoveMainScroll('x')
        if (!mainScrollChanged) {
          panOrMoveMainScroll('y')
          if (currSlide) {
            roundPoint(currSlide.pan)
            currSlide.applyCurrentZoomPan()
          }
        }
      }
    },

    end() {
      const currSlide = deps.getCurrSlide()
      let indexDiff = 0

      deps.animations.stopAll()

      if (deps.mainScroll.isShifted()) {
        const mainScrollShiftDiff = deps.mainScroll.x - deps.mainScroll.getCurrSlideX()
        const currentSlideVisibilityRatio = mainScrollShiftDiff / deps.viewportSize.x

        if (
          (state.velocity.x < -MIN_NEXT_SLIDE_SPEED && currentSlideVisibilityRatio < 0)
          || (state.velocity.x < 0.1 && currentSlideVisibilityRatio < -0.5)
        ) {
          indexDiff = 1
          state.velocity.x = Math.min(state.velocity.x, 0)
        }
        else if (
          (state.velocity.x > MIN_NEXT_SLIDE_SPEED && currentSlideVisibilityRatio > 0)
          || (state.velocity.x > -0.1 && currentSlideVisibilityRatio > 0.5)
        ) {
          indexDiff = -1
          state.velocity.x = Math.max(state.velocity.x, 0)
        }

        deps.mainScroll.moveIndexBy(indexDiff, true, state.velocity.x)
      }

      if (
        (currSlide && currSlide.currZoomLevel > currSlide.zoomLevels.max)
        || state.isMultitouch
      ) {
        getZoomHandler().correctZoomPan(true)
      }
      else {
        finishPanGestureForAxis('x')
        finishPanGestureForAxis('y')
      }
    },
  }

  function getVerticalDragRatio(panY: number): number {
    return (panY - (deps.getCurrSlide()?.bounds.center.y ?? 0)) / (deps.viewportSize.y / 3)
  }

  function setPanWithFriction(axis: 'x' | 'y', potentialPan: number, customFriction?: number): void {
    const currSlide = deps.getCurrSlide()
    if (!currSlide) return

    const { pan, bounds } = currSlide
    const correctedPan = bounds.correctPan(axis, potentialPan)
    if (correctedPan !== potentialPan || customFriction) {
      const delta = Math.round(potentialPan - pan[axis])
      pan[axis] += delta * (customFriction || PAN_END_FRICTION)
    }
    else {
      pan[axis] = potentialPan
    }
  }

  function panOrMoveMainScroll(axis: 'x' | 'y'): boolean {
    const currSlide = deps.getCurrSlide()
    const delta = state.p1[axis] - state.prevP1[axis]
    const newMainScrollX = deps.mainScroll.x + delta

    if (!delta || !currSlide) return false

    if (axis === 'x' && !currSlide.isPannable() && !state.isMultitouch) {
      deps.mainScroll.moveTo(newMainScrollX, true)
      return true
    }

    const { bounds } = currSlide
    const newPan = currSlide.pan[axis] + delta

    if (deps.options.allowPanToNext && state.dragAxis === 'x' && axis === 'x' && !state.isMultitouch) {
      const currSlideMainScrollX = deps.mainScroll.getCurrSlideX()
      const mainScrollShiftDiff = deps.mainScroll.x - currSlideMainScrollX
      const isLeftToRight = delta > 0
      const isRightToLeft = !isLeftToRight

      if (newPan > bounds.min[axis] && isLeftToRight) {
        const wasAtMinPanPosition = bounds.min[axis] <= handler.startPan[axis]
        if (wasAtMinPanPosition) {
          deps.mainScroll.moveTo(newMainScrollX, true)
          return true
        }
        else {
          setPanWithFriction(axis, newPan)
        }
      }
      else if (newPan < bounds.max[axis] && isRightToLeft) {
        const wasAtMaxPanPosition = handler.startPan[axis] <= bounds.max[axis]
        if (wasAtMaxPanPosition) {
          deps.mainScroll.moveTo(newMainScrollX, true)
          return true
        }
        else {
          setPanWithFriction(axis, newPan)
        }
      }
      else if (mainScrollShiftDiff !== 0) {
        if (mainScrollShiftDiff > 0) {
          deps.mainScroll.moveTo(Math.max(newMainScrollX, currSlideMainScrollX), true)
          return true
        }
        deps.mainScroll.moveTo(Math.min(newMainScrollX, currSlideMainScrollX), true)
        return true
      }
      else {
        setPanWithFriction(axis, newPan)
      }
    }
    else if (axis === 'y') {
      if (!deps.mainScroll.isShifted() && bounds.min.y !== bounds.max.y) {
        setPanWithFriction(axis, newPan)
      }
    }
    else {
      setPanWithFriction(axis, newPan)
    }

    return false
  }

  function finishPanGestureForAxis(axis: 'x' | 'y'): void {
    const currSlide = deps.getCurrSlide()

    if (!currSlide) return

    const { pan, bounds } = currSlide
    const panPos = pan[axis]
    const restoreBgOpacity = deps.getBgOpacity() < 1 && axis === 'y'
    const decelerationRate = 0.995
    const projectedPosition = panPos + project(state.velocity[axis], decelerationRate)

    if (restoreBgOpacity) {
      const vDragRatio = getVerticalDragRatio(panPos)
      const projectedVDragRatio = getVerticalDragRatio(projectedPosition)

      if (
        (vDragRatio < 0 && projectedVDragRatio < -MIN_RATIO_TO_CLOSE)
        || (vDragRatio > 0 && projectedVDragRatio > MIN_RATIO_TO_CLOSE)
      ) {
        deps.close()
        return
      }
    }

    const correctedPanPosition = bounds.correctPan(axis, projectedPosition)
    if (panPos === correctedPanPosition) return

    const dampingRatio = correctedPanPosition === projectedPosition ? 1 : 0.82
    const initialBgOpacity = deps.getBgOpacity()
    const totalPanDist = correctedPanPosition - panPos

    deps.animations.startSpring({
      name: 'panGesture' + axis,
      isPan: true,
      start: panPos,
      end: correctedPanPosition,
      velocity: state.velocity[axis],
      dampingRatio,
      onUpdate: (pos) => {
        if (restoreBgOpacity && deps.getBgOpacity() < 1) {
          const animationProgressRatio = 1 - (correctedPanPosition - pos) / totalPanDist
          deps.applyBgOpacity(clamp(initialBgOpacity + (1 - initialBgOpacity) * animationProgressRatio, 0, 1))
        }
        pan[axis] = Math.floor(pos)
        currSlide.applyCurrentZoomPan()
      },
    })
  }

  return handler
}
