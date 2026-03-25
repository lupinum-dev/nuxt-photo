import { useEventListener } from '../../utils/dom-helpers'
import type { LightboxInstance, ScrollWheelInstance } from '../types'

export function useScrollWheel(lightbox: LightboxInstance): ScrollWheelInstance {
  function onWheel(e: WheelEvent): void {
    if (lightbox.isDestroying) return
    e.preventDefault()
    const { currSlide } = lightbox
    let { deltaX, deltaY } = e

    if (!currSlide) return
    if (lightbox.dispatch('wheel', { originalEvent: e }).defaultPrevented) return

    if (e.ctrlKey || lightbox.options.wheelToZoom) {
      if (currSlide.isZoomable()) {
        let zoomFactor = -deltaY
        if (e.deltaMode === 1) {
          zoomFactor *= 0.05
        }
        else {
          zoomFactor *= e.deltaMode ? 1 : 0.002
        }
        zoomFactor = 2 ** zoomFactor

        const destZoomLevel = currSlide.currZoomLevel * zoomFactor
        currSlide.zoomTo(destZoomLevel, { x: e.clientX, y: e.clientY })
      }
    }
    else if (currSlide.isPannable()) {
      if (e.deltaMode === 1) {
        deltaX *= 18
        deltaY *= 18
      }
      currSlide.panTo(currSlide.pan.x - deltaX, currSlide.pan.y - deltaY)
    }
  }

  useEventListener(lightbox.element, 'wheel', onWheel as EventListener)

  return {}
}
