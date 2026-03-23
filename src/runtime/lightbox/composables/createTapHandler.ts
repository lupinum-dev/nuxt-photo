import type { LightboxInstance, Point, TapHandlerInstance } from '../types'
import type { GestureDeps, GestureState } from './createGestures'

type Actions = 'imageClick' | 'bgClick' | 'tap' | 'doubleTap'

function didTapOnMainContent(event: PointerEvent): boolean {
  return Boolean((event.target as HTMLElement).closest('.photo-lightbox__container'))
}

export function createTapHandler({
  deps,
}: {
  deps: GestureDeps
  state: GestureState
}): TapHandlerInstance {
  function doClickOrTapAction(actionName: Actions, point: Point, originalEvent: PointerEvent): void {
    const currSlide = deps.getCurrSlide()
    const actionFullName = (actionName + 'Action') as `${Actions}Action`
    const optionValue = deps.options[actionFullName]

    if (deps.dispatch(actionFullName, { point, originalEvent }).defaultPrevented) return

    if (typeof optionValue === 'function') {
      (optionValue as (point: Point, e: PointerEvent) => void).call(
        deps.getInstance() as LightboxInstance,
        point,
        originalEvent,
      )
      return
    }

    switch (optionValue) {
      case 'close':
        deps.close()
        break
      case 'next':
        deps.next()
        break
      case 'zoom':
        currSlide?.toggleZoom(point)
        break
      case 'zoom-or-close':
        if (
          currSlide?.isZoomable()
          && currSlide.zoomLevels.secondary !== currSlide.zoomLevels.initial
        ) {
          currSlide.toggleZoom(point)
        }
        else if (deps.options.clickToCloseNonZoomable) {
          deps.close()
        }
        break
      case 'toggle-ui':
        deps.setUIVisible(!deps.getInstance().uiVisible)
        break
    }
  }

  return {
    click(point: Point, originalEvent: PointerEvent) {
      const targetClassList = (originalEvent.target as HTMLElement).classList
      const isImageClick = targetClassList.contains('photo-lightbox__img')
      const isBackgroundClick
        = targetClassList.contains('photo-lightbox__item') || targetClassList.contains('photo-lightbox__zoom-wrap')

      if (isImageClick) {
        doClickOrTapAction('imageClick', point, originalEvent)
      }
      else if (isBackgroundClick) {
        doClickOrTapAction('bgClick', point, originalEvent)
      }
    },

    tap(point: Point, originalEvent: PointerEvent) {
      if (didTapOnMainContent(originalEvent)) {
        doClickOrTapAction('tap', point, originalEvent)
      }
    },

    doubleTap(point: Point, originalEvent: PointerEvent) {
      if (didTapOnMainContent(originalEvent)) {
        doClickOrTapAction('doubleTap', point, originalEvent)
      }
    },
  }
}
