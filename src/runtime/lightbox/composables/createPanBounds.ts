import type { Axis, PanBoundsInstance, SlideInstance } from '../types'
import { clamp } from '../utils/math'
import { parsePaddingOption } from './useViewportSize'

export function createPanBounds(slide: SlideInstance): PanBoundsInstance {
  const bounds: PanBoundsInstance = {
    slide,
    currZoomLevel: 1,
    center: { x: 0, y: 0 },
    max: { x: 0, y: 0 },
    min: { x: 0, y: 0 },

    update(currZoomLevel: number) {
      this.currZoomLevel = currZoomLevel
      if (!this.slide.width) {
        this.reset()
      }
      else {
        updateAxis('x')
        updateAxis('y')
        this.slide.lightbox.dispatch('calcBounds', { slide: this.slide })
      }
    },

    reset() {
      this.center.x = 0
      this.center.y = 0
      this.max.x = 0
      this.max.y = 0
      this.min.x = 0
      this.min.y = 0
    },

    correctPan(axis: Axis, panOffset: number): number {
      return clamp(panOffset, this.max[axis], this.min[axis])
    },
  }

  function updateAxis(axis: Axis): void {
    const { lightbox } = bounds.slide
    const elSize = bounds.slide[axis === 'x' ? 'width' : 'height'] * bounds.currZoomLevel
    const paddingProp = axis === 'x' ? 'left' : 'top'
    const padding = parsePaddingOption(
      paddingProp,
      lightbox.options,
      lightbox.viewportSize,
      bounds.slide.data,
      bounds.slide.index,
    )

    const panAreaSize = bounds.slide.panAreaSize[axis]

    bounds.center[axis] = Math.round((panAreaSize - elSize) / 2) + padding
    bounds.max[axis] = elSize > panAreaSize
      ? Math.round(panAreaSize - elSize) + padding
      : bounds.center[axis]
    bounds.min[axis] = elSize > panAreaSize ? padding : bounds.center[axis]
  }

  return bounds
}
