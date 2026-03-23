import { clamp, equalizePoints, getDistanceBetween, pointsEqual } from '../utils/math'
import type { Point, ZoomHandlerInstance } from '../types'
import type { GestureDeps, GestureState } from './createGestures'

const UPPER_ZOOM_FRICTION = 0.05
const LOWER_ZOOM_FRICTION = 0.15

function getZoomPointsCenter(p: Point, p1: Point, p2: Point): Point {
  p.x = (p1.x + p2.x) / 2
  p.y = (p1.y + p2.y) / 2
  return p
}

export function createZoomHandler({
  state,
  deps,
}: {
  state: GestureState
  deps: GestureDeps
}): ZoomHandlerInstance {
  const startPan: Point = { x: 0, y: 0 }
  const startZoomPoint: Point = { x: 0, y: 0 }
  const zoomPoint: Point = { x: 0, y: 0 }
  let wasOverFitZoomLevel = false
  let startZoomLevel = 1

  function calculatePanForZoomLevel(axis: 'x' | 'y', currZoomLevel: number): number {
    const zoomFactor = currZoomLevel / startZoomLevel
    return zoomPoint[axis] - ((startZoomPoint[axis] - startPan[axis]) * zoomFactor)
  }

  const handler: ZoomHandlerInstance = {
    start() {
      const currSlide = deps.getCurrSlide()
      if (currSlide) {
        startZoomLevel = currSlide.currZoomLevel
        equalizePoints(startPan, currSlide.pan)
      }
      deps.animations.stopAllPan()
      wasOverFitZoomLevel = false
    },

    change() {
      const currSlide = deps.getCurrSlide()
      if (!currSlide) return

      const minZoomLevel = currSlide.zoomLevels.min
      const maxZoomLevel = currSlide.zoomLevels.max

      if (!currSlide.isZoomable() || deps.mainScroll.isShifted()) return

      getZoomPointsCenter(startZoomPoint, state.startP1, state.startP2)
      getZoomPointsCenter(zoomPoint, state.p1, state.p2)

      let currZoomLevel
        = (1 / getDistanceBetween(state.startP1, state.startP2))
          * getDistanceBetween(state.p1, state.p2)
          * startZoomLevel

      if (currZoomLevel > currSlide.zoomLevels.initial + currSlide.zoomLevels.initial / 15) {
        wasOverFitZoomLevel = true
      }

      if (currZoomLevel < minZoomLevel) {
        if (
          deps.options.pinchToClose
          && !wasOverFitZoomLevel
          && startZoomLevel <= currSlide.zoomLevels.initial
        ) {
          const bgOpacity = 1 - (minZoomLevel - currZoomLevel) / (minZoomLevel / 1.2)
          if (!deps.dispatch('pinchClose', { bgOpacity }).defaultPrevented) {
            deps.applyBgOpacity(bgOpacity)
          }
        }
        else {
          currZoomLevel = minZoomLevel - (minZoomLevel - currZoomLevel) * LOWER_ZOOM_FRICTION
        }
      }
      else if (currZoomLevel > maxZoomLevel) {
        currZoomLevel = maxZoomLevel + (currZoomLevel - maxZoomLevel) * UPPER_ZOOM_FRICTION
      }

      currSlide.pan.x = calculatePanForZoomLevel('x', currZoomLevel)
      currSlide.pan.y = calculatePanForZoomLevel('y', currZoomLevel)
      currSlide.setZoomLevel(currZoomLevel)
      currSlide.applyCurrentZoomPan()
    },

    end() {
      const currSlide = deps.getCurrSlide()
      if (
        (!currSlide || currSlide.currZoomLevel < currSlide.zoomLevels.initial)
        && !wasOverFitZoomLevel
        && deps.options.pinchToClose
      ) {
        deps.close()
      }
      else {
        handler.correctZoomPan()
      }
    },

    correctZoomPan(ignoreGesture?: boolean) {
      const currSlide = deps.getCurrSlide()

      if (!currSlide?.isZoomable()) return

      if (zoomPoint.x === 0) {
        ignoreGesture = true
      }

      const prevZoomLevel = currSlide.currZoomLevel
      let destinationZoomLevel: number
      let currZoomLevelNeedsChange = true

      if (prevZoomLevel < currSlide.zoomLevels.initial) {
        destinationZoomLevel = currSlide.zoomLevels.initial
      }
      else if (prevZoomLevel > currSlide.zoomLevels.max) {
        destinationZoomLevel = currSlide.zoomLevels.max
      }
      else {
        currZoomLevelNeedsChange = false
        destinationZoomLevel = prevZoomLevel
      }

      const initialBgOpacity = deps.getBgOpacity()
      const restoreBgOpacity = initialBgOpacity < 1

      const initialPan = equalizePoints({ x: 0, y: 0 }, currSlide.pan)
      let destinationPan = equalizePoints({ x: 0, y: 0 }, initialPan)

      if (ignoreGesture) {
        zoomPoint.x = 0
        zoomPoint.y = 0
        startZoomPoint.x = 0
        startZoomPoint.y = 0
        startZoomLevel = prevZoomLevel
        equalizePoints(startPan, initialPan)
      }

      if (currZoomLevelNeedsChange) {
        destinationPan = {
          x: calculatePanForZoomLevel('x', destinationZoomLevel),
          y: calculatePanForZoomLevel('y', destinationZoomLevel),
        }
      }

      currSlide.setZoomLevel(destinationZoomLevel)
      destinationPan = {
        x: currSlide.bounds.correctPan('x', destinationPan.x),
        y: currSlide.bounds.correctPan('y', destinationPan.y),
      }
      currSlide.setZoomLevel(prevZoomLevel)

      const panNeedsChange = !pointsEqual(destinationPan, initialPan)

      if (!panNeedsChange && !currZoomLevelNeedsChange && !restoreBgOpacity) {
        currSlide._setResolution(destinationZoomLevel)
        currSlide.applyCurrentZoomPan()
        return
      }

      deps.animations.stopAllPan()

      deps.animations.startSpring({
        isPan: true,
        start: 0,
        end: 1000,
        velocity: 0,
        dampingRatio: 1,
        naturalFrequency: 40,
        onUpdate: (now) => {
          now /= 1000
          if (panNeedsChange || currZoomLevelNeedsChange) {
            if (panNeedsChange) {
              currSlide.pan.x = initialPan.x + (destinationPan.x - initialPan.x) * now
              currSlide.pan.y = initialPan.y + (destinationPan.y - initialPan.y) * now
            }
            if (currZoomLevelNeedsChange) {
              const newZoomLevel = prevZoomLevel + (destinationZoomLevel - prevZoomLevel) * now
              currSlide.setZoomLevel(newZoomLevel)
            }
            currSlide.applyCurrentZoomPan()
          }
          if (restoreBgOpacity && deps.getBgOpacity() < 1) {
            deps.applyBgOpacity(clamp(initialBgOpacity + (1 - initialBgOpacity) * now, 0, 1))
          }
        },
        onComplete: () => {
          currSlide._setResolution(destinationZoomLevel)
          currSlide.applyCurrentZoomPan()
        },
      })
    },
  }

  return handler
}
