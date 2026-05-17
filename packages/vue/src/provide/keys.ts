import type {
  Component,
  ComponentPublicInstance,
  ComputedRef,
  CSSProperties,
  InjectionKey,
  Ref,
} from 'vue'
import type {
  GestureMode,
  ImageAdapter,
  PanState,
  PhotoItem,
  ZoomState,
} from '@nuxt-photo/core'
/** Small public controller returned by `useLightbox()` and `useLightboxProvider()`. */
export interface LightboxController {
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
  openPhoto(photo: PhotoItem): Promise<void>
  openById(id: string | number): Promise<void>
}

type LightboxRuntimeState = {
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
  activeImageLoadFailed: Ref<boolean>
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
}

type LightboxDomBindings = {
  mediaAreaRef: Ref<HTMLElement | null>
  emblaRef: Ref<HTMLElement | null | undefined>
  setThumbRef: (
    index: number,
  ) => (el: Element | ComponentPublicInstance | null) => void
  setSlideZoomRef: (
    index: number,
  ) => (el: Element | ComponentPublicInstance | null) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => void
}

export type InternalLightboxContext = Omit<
  LightboxController,
  'openPhoto' | 'openById'
> &
  LightboxRuntimeState &
  LightboxDomBindings

export type LightboxSlideRenderer = (props: {
  photo: PhotoItem
  index: number
}) => unknown

export const LightboxContextKey: InjectionKey<InternalLightboxContext> = Symbol(
  'nuxt-photo:lightbox',
)
export const LightboxSlideRendererKey: InjectionKey<
  (photo: PhotoItem) => LightboxSlideRenderer | null
> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol(
  'nuxt-photo:image-adapter',
)

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: ComputedRef<'auto' | 'explicit'>
  register(
    id: symbol,
    photo: PhotoItem,
    getThumbEl: () => HTMLElement | null,
    renderSlide?: LightboxSlideRenderer | null,
  ): void
  unregister(id: symbol): void
  open(index?: number): Promise<void>
  openPhoto(photo: PhotoItem): Promise<void>
  openById(id: string | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol(
  'nuxt-photo:photo-group',
)

/**
 * Provide a custom lightbox component globally so Photo/PhotoGroup/PhotoAlbum
 * use it by default without requiring per-instance :lightbox props.
 *
 * Usage in app.vue:
 *   import MyLightbox from '~/components/Lightbox.vue'
 *   provide(LightboxComponentKey, MyLightbox)
 */
export const LightboxComponentKey: InjectionKey<Component> = Symbol(
  'nuxt-photo:lightbox-component',
)

/** Global defaults for lightbox behaviour, typically provided once at app level. */
export interface LightboxDefaults {
  minZoom?: number
}
export const LightboxDefaultsKey: InjectionKey<LightboxDefaults> = Symbol(
  'nuxt-photo:lightbox-defaults',
)
