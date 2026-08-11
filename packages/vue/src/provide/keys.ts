import type {
  Component,
  ComponentPublicInstance,
  ComputedRef,
  CSSProperties,
  InjectionKey,
  Ref,
  VNodeChild,
} from 'vue'
import type { GestureMode, ImageAdapter, PanState, PhotoItem, ZoomState } from '../core/index'

export type LightboxLifecycleStatus = 'closed' | 'opening' | 'open' | 'closing'

/** Small public controller returned by `useLightbox()` and `useLightboxProvider()`. */
export interface LightboxController<TMeta extends object = Readonly<Record<string, unknown>>> {
  readonly photos: ComputedRef<readonly PhotoItem<TMeta>[]>
  readonly count: ComputedRef<number>
  readonly activeIndex: ComputedRef<number>
  readonly activePhoto: ComputedRef<PhotoItem<TMeta> | null>
  readonly isOpen: ComputedRef<boolean>
  open(index?: number): Promise<void>
  openById(id: string): Promise<void>
  close(): Promise<void>
  next(): void
  prev(): void
  toggleZoom(): void
}

export interface LightboxProviderController<
  TMeta extends object = Readonly<Record<string, unknown>>,
> extends LightboxController<TMeta> {
  readonly hiddenThumbnailIndex: Readonly<Ref<number | null>>
  setThumbnailRef(index: number): (element: Element | ComponentPublicInstance | null) => void
}

type LightboxRuntimeState = {
  lifecycleStatus: Ref<LightboxLifecycleStatus>
  zoomState: Ref<ZoomState>
  panState: Ref<PanState>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  animating: Ref<boolean>
  hiddenThumbIndex: Ref<number | null>
  activeImageLoadFailed: Ref<boolean>
  uiVisible: Ref<boolean>
  closeDragY: Ref<number>
  stageMounted: Ref<boolean>
  activeImagePending: Ref<boolean>
  transitionInProgress: ComputedRef<boolean>
  gesturePhase: Ref<GestureMode>
  getSlideFrameStyle: (photo: PhotoItem) => CSSProperties
  isSlideMediaMounted: (index: number) => boolean
}

type LightboxDomBindings = {
  mediaAreaRef: Ref<HTMLElement | null>
  emblaRef: Ref<HTMLElement | null | undefined>
  setThumbRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideZoomRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideFrameRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setSlideImageRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  setOverlayRef: (el: Element | ComponentPublicInstance | null) => void
  setViewportRef: (el: Element | ComponentPublicInstance | null) => void
  setControlsRef: (el: Element | ComponentPublicInstance | null) => void
  setCaptionRef: (el: Element | ComponentPublicInstance | null) => void
  setTransitionFrameRef: (el: Element | ComponentPublicInstance | null) => void
  setTransitionImageRef: (el: Element | ComponentPublicInstance | null) => void
  setTransitionShadowRef: (el: Element | ComponentPublicInstance | null) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => Promise<void> | undefined
}

export type InternalLightboxContext = Omit<
  LightboxController,
  'openById' | 'activeIndex' | 'photos'
> & {
  photos: ComputedRef<PhotoItem[]>
  activeIndex: Ref<number>
} & LightboxRuntimeState &
  LightboxDomBindings

export type LightboxSlideRenderer<TMeta extends object = Readonly<Record<string, unknown>>> =
  (props: { photo: PhotoItem<TMeta>; index: number }) => VNodeChild

export const LightboxContextKey: InjectionKey<InternalLightboxContext> =
  Symbol('nuxt-photo:lightbox')
export const LightboxSlideRendererKey: InjectionKey<
  (photo: PhotoItem) => LightboxSlideRenderer | null
> = Symbol('nuxt-photo:lightbox-slide-renderer')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

/**
 * Provide a custom lightbox component globally so Photo/PhotoGroup/PhotoAlbum
 * use it by default without requiring per-instance :lightbox props.
 *
 * Usage in app.vue:
 *   import MyLightbox from '~/components/Lightbox.vue'
 *   provide(LightboxComponentKey, MyLightbox)
 */
export const LightboxComponentKey: InjectionKey<Component> = Symbol('nuxt-photo:lightbox-component')

/** Global defaults for lightbox behaviour, typically provided once at app level. */
export interface LightboxDefaults {
  minZoom?: number
}
export const LightboxDefaultsKey: InjectionKey<LightboxDefaults> = Symbol(
  'nuxt-photo:lightbox-defaults',
)
