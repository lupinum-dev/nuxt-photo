import type { Component, ComponentPublicInstance, ComputedRef, CSSProperties, InjectionKey, Ref } from 'vue'
import type { GestureMode, ImageAdapter, PanState, PhotoItem, ZoomState } from '@nuxt-photo/core'
import type { LightboxCaptionSlotProps, LightboxControlsSlotProps, LightboxSlideSlotProps } from '../types/slots'

/** Consumer API — what app code and recipe components need. */
export interface LightboxConsumerAPI {
  photos: ComputedRef<PhotoItem[]>
  count: ComputedRef<number>
  activeIndex: Ref<number>
  activePhoto: ComputedRef<PhotoItem | null>
  isOpen: ComputedRef<boolean>
  open: (photoOrIndex?: PhotoItem | number) => Promise<void>
  close: () => Promise<void>
  next: () => void
  prev: () => void
  toggleZoom: () => void
}

/** Render state — what primitive components read for styling and visibility. */
export interface LightboxRenderState {
  zoomState: Ref<ZoomState>
  panState: Ref<PanState>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  animating: Ref<boolean>
  ghostVisible: Ref<boolean>
  ghostSrc: Ref<string>
  ghostStyle: Ref<CSSProperties>
  hiddenThumbIndex: Ref<number | null>
  overlayOpacity: Ref<number>
  mediaOpacity: Ref<number>
  chromeOpacity: Ref<number>
  uiVisible: Ref<boolean>
  closeDragY: Ref<number>
  transitionInProgress: ComputedRef<boolean>
  chromeStyle: ComputedRef<CSSProperties>
  closeDragRatio: ComputedRef<number>
  backdropStyle: ComputedRef<CSSProperties>
  lightboxUiStyle: ComputedRef<CSSProperties>
  gesturePhase: Ref<GestureMode>
  getSlideFrameStyle: (photo: PhotoItem) => CSSProperties
  getSlideEffectStyle: (index: number) => CSSProperties
}

/** DOM bindings — what primitives need to wire up event handlers and refs. */
export interface LightboxDOMBindings {
  mediaAreaRef: Ref<HTMLElement | null>
  emblaRef: Ref<HTMLElement | null | undefined>
  setThumbRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideZoomRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => void
}

/** Full lightbox context — the intersection of all role-specific interfaces. */
export type LightboxContext = LightboxConsumerAPI & LightboxRenderState & LightboxDOMBindings

export type LightboxSlideRenderer = (props: { photo: PhotoItem; index: number }) => unknown

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('nuxt-photo:lightbox')
export const LightboxSlideRendererKey: InjectionKey<(photo: PhotoItem) => LightboxSlideRenderer | null> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: 'auto' | 'explicit'
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null, renderSlide?: LightboxSlideRenderer | null): void
  unregister(id: symbol): void
  open(index?: number): Promise<void>
  openPhoto(photo: PhotoItem): Promise<void>
  openById(id: string | number): Promise<void>
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

/** Slot overrides injected by recipe components for customizing InternalLightbox. */
export interface LightboxSlotOverrides {
  toolbar?: (props: LightboxControlsSlotProps) => unknown
  caption?: (props: LightboxCaptionSlotProps) => unknown
  slide?: (props: LightboxSlideSlotProps) => unknown
}
export const LightboxSlotsKey: InjectionKey<Ref<LightboxSlotOverrides>> = Symbol('nuxt-photo:lightbox-slots')

/** Global defaults for lightbox behaviour, typically provided once at app level. */
export interface LightboxDefaults {
  minZoom?: number
}
export const LightboxDefaultsKey: InjectionKey<LightboxDefaults> = Symbol('nuxt-photo:lightbox-defaults')
