import type { Component, CSSProperties, ComputedRef, InjectionKey, Ref } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import type { useLightboxContext } from '../composables/useLightboxContext'

export type LightboxContext = ReturnType<typeof useLightboxContext>

export type LightboxControllerContext = Pick<
  LightboxContext,
  'count' | 'activeIndex' | 'activePhoto' | 'isOpen' | 'open' | 'close' | 'next' | 'prev'
>

export type LightboxChromeContext = Pick<
  LightboxContext,
  'photos' | 'count' | 'activeIndex' | 'activePhoto' | 'isZoomedIn' | 'zoomAllowed' | 'transitionInProgress' | 'chromeStyle' | 'close' | 'next' | 'prev' | 'toggleZoom'
>

export type LightboxOverlayContext = Pick<LightboxContext, 'backdropStyle' | 'handleBackdropClick'>
export type LightboxPortalContext = Pick<LightboxContext, 'ghostVisible' | 'ghostSrc' | 'ghostStyle'>
export type LightboxTriggerContext = Pick<LightboxContext, 'open' | 'setThumbRef' | 'hiddenThumbIndex'>
export type LightboxStageContext = Pick<
  LightboxContext,
  'photos' | 'mediaAreaRef' | 'emblaRef' | 'mediaOpacity' | 'isZoomedIn' | 'gesturePhase' | 'onMediaPointerDown' | 'onMediaPointerMove' | 'onMediaPointerUp' | 'onMediaPointerCancel' | 'onWheel'
>
export type LightboxSlidesContext = Pick<
  LightboxContext,
  'activeIndex' | 'getSlideEffectStyle' | 'getSlideFrameStyle' | 'setSlideZoomRef'
>
export type LightboxCaptionContext = Pick<LightboxContext, 'activeIndex' | 'activePhoto'>

export type LightboxSlideRenderer = (props: { photo: PhotoItem; index: number }) => unknown

export const LightboxControllerKey: InjectionKey<LightboxControllerContext> = Symbol('nuxt-photo:lightbox-controller')
export const LightboxChromeKey: InjectionKey<LightboxChromeContext> = Symbol('nuxt-photo:lightbox-chrome')
export const LightboxOverlayKey: InjectionKey<LightboxOverlayContext> = Symbol('nuxt-photo:lightbox-overlay')
export const LightboxPortalKey: InjectionKey<LightboxPortalContext> = Symbol('nuxt-photo:lightbox-portal')
export const LightboxTriggerKey: InjectionKey<LightboxTriggerContext> = Symbol('nuxt-photo:lightbox-trigger')
export const LightboxStageKey: InjectionKey<LightboxStageContext> = Symbol('nuxt-photo:lightbox-stage')
export const LightboxSlidesKey: InjectionKey<LightboxSlidesContext> = Symbol('nuxt-photo:lightbox-slides')
export const LightboxCaptionKey: InjectionKey<LightboxCaptionContext> = Symbol('nuxt-photo:lightbox-caption')
export const LightboxSlideRendererKey: InjectionKey<(photo: PhotoItem) => LightboxSlideRenderer | null> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: 'auto' | 'explicit'
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null): void
  unregister(id: symbol): void
  open(photoOrIndex: PhotoItem | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol('nuxt-photo:photo-group')

/**
 * Provide a custom lightbox component globally so Photo/PhotoGroup/PhotoAlbum
 * use it by default without requiring per-instance :lightbox props.
 *
 * Usage in app.vue:
 *   import MyLightbox from '~/components/Lightbox.vue'
 *   provide(LightboxComponentKey, MyLightbox)
 */
export const LightboxComponentKey: InjectionKey<Component> = Symbol('nuxt-photo:lightbox-component')
