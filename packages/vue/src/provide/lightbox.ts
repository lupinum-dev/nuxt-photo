import { provide } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import {
  LightboxCaptionKey,
  LightboxChromeKey,
  LightboxControllerKey,
  type LightboxContext,
  LightboxOverlayKey,
  LightboxPortalKey,
  LightboxSlideRendererKey,
  type LightboxSlideRenderer,
  LightboxSlidesKey,
  LightboxStageKey,
  LightboxTriggerKey,
} from './keys'

export function provideLightboxContexts(
  ctx: LightboxContext,
  options?: { resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null },
) {
  provide(LightboxControllerKey, {
    count: ctx.count,
    activeIndex: ctx.activeIndex,
    activePhoto: ctx.activePhoto,
    isOpen: ctx.isOpen,
    open: ctx.open,
    close: ctx.close,
    next: ctx.next,
    prev: ctx.prev,
  })

  provide(LightboxChromeKey, {
    photos: ctx.photos,
    count: ctx.count,
    activeIndex: ctx.activeIndex,
    activePhoto: ctx.activePhoto,
    isZoomedIn: ctx.isZoomedIn,
    zoomAllowed: ctx.zoomAllowed,
    transitionInProgress: ctx.transitionInProgress,
    chromeStyle: ctx.chromeStyle,
    close: ctx.close,
    next: ctx.next,
    prev: ctx.prev,
    toggleZoom: ctx.toggleZoom,
  })

  provide(LightboxOverlayKey, {
    backdropStyle: ctx.backdropStyle,
    handleBackdropClick: ctx.handleBackdropClick,
  })

  provide(LightboxPortalKey, {
    ghostVisible: ctx.ghostVisible,
    ghostSrc: ctx.ghostSrc,
    ghostStyle: ctx.ghostStyle,
  })

  provide(LightboxTriggerKey, {
    open: ctx.open,
    setThumbRef: ctx.setThumbRef,
    hiddenThumbIndex: ctx.hiddenThumbIndex,
  })

  provide(LightboxStageKey, {
    photos: ctx.photos,
    mediaAreaRef: ctx.mediaAreaRef,
    emblaRef: ctx.emblaRef,
    mediaOpacity: ctx.mediaOpacity,
    isZoomedIn: ctx.isZoomedIn,
    gesturePhase: ctx.gesturePhase,
    onMediaPointerDown: ctx.onMediaPointerDown,
    onMediaPointerMove: ctx.onMediaPointerMove,
    onMediaPointerUp: ctx.onMediaPointerUp,
    onMediaPointerCancel: ctx.onMediaPointerCancel,
    onWheel: ctx.onWheel,
  })

  provide(LightboxSlidesKey, {
    activeIndex: ctx.activeIndex,
    getSlideEffectStyle: ctx.getSlideEffectStyle,
    getSlideFrameStyle: ctx.getSlideFrameStyle,
    setSlideZoomRef: ctx.setSlideZoomRef,
  })

  provide(LightboxCaptionKey, {
    activeIndex: ctx.activeIndex,
    activePhoto: ctx.activePhoto,
  })

  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
}
