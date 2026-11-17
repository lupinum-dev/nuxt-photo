import type { ResolvedPhotoConfig } from '../config'
import type { GlowChannel } from '../lightbox/glow'
import type {
  ComponentPublicInstance,
  ComputedRef,
  CSSProperties,
  InjectionKey,
  Ref,
  VNodeChild,
} from 'vue'
import type {
  GestureMode,
  LightboxNavigationMode,
  PanState,
  ResolvedPhotoItem,
  ZoomState,
} from '../core/index'

export type LightboxLifecycleStatus = 'closed' | 'opening' | 'open' | 'closing'

/** Small public controller returned by `useLightbox()` and `provideLightbox()`. */
export interface LightboxController<TMeta extends object = Readonly<Record<string, unknown>>> {
  readonly photos: ComputedRef<readonly ResolvedPhotoItem<TMeta>[]>
  readonly count: ComputedRef<number>
  readonly activeId: ComputedRef<string | null>
  readonly activeIndex: ComputedRef<number>
  readonly activePhoto: ComputedRef<ResolvedPhotoItem<TMeta> | null>
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
  /** ID of the photo whose thumbnail the lightbox animation covers, or null. */
  readonly hiddenThumbnailId: Readonly<Ref<string | null>>
}

type LightboxRuntimeState = {
  lifecycleStatus: Ref<LightboxLifecycleStatus>
  reducedMotion: Ref<boolean>
  zoomState: Ref<ZoomState>
  panState: Ref<PanState>
  isZoomedIn: ComputedRef<boolean>
  zoomAllowed: ComputedRef<boolean>
  animating: Ref<boolean>
  hiddenThumbnailId: Ref<string | null>
  activeImageLoadFailed: Ref<boolean>
  uiVisible: Ref<boolean>
  stageMounted: Ref<boolean>
  activeImagePending: Ref<boolean>
  transitionInProgress: ComputedRef<boolean>
  photoConfig: ComputedRef<ResolvedPhotoConfig>
  initialOpening: Ref<boolean>
  /** The full-size layer inside the root dialog; the fullscreen tool targets it. */
  rootRef: Ref<HTMLElement | null>
  direction: ComputedRef<'ltr' | 'rtl'>
  navigationMode: ComputedRef<LightboxNavigationMode>
  gesturePhase: Ref<GestureMode>
  getSlideFrameStyle: (photo: ResolvedPhotoItem) => CSSProperties
  frameVars: ComputedRef<Record<string, string>>
  isSlideMediaMounted: (index: number) => boolean
  onSlideImageLoad: (index: number) => void
  isSlideLeaving: (index: number) => boolean
}

type LightboxDomBindings = {
  mediaAreaRef: Ref<HTMLElement | null>
  /** The element that clips the slide track (`viewportRef` in the viewport slot). */
  trackRef: Ref<HTMLElement | null | undefined>
  /** The page element that shows a photo: the activated one, else the provider's lookup. */
  thumbnailFor: (id: string) => HTMLElement | null
  /** Where a mounted `LightboxAmbient` connects to follow the photos' motion. */
  glow: GlowChannel
  setSlideZoomRef: (index: number) => (el: Element | ComponentPublicInstance | null) => void
  /** A slide caption that mounted: it takes the controls' visibility while the lightbox is open. */
  adoptCaption: (element: HTMLElement) => void
  onMediaPointerDown: (e: PointerEvent) => void
  onMediaPointerMove: (e: PointerEvent) => void
  onMediaPointerUp: (e: PointerEvent) => void
  onMediaPointerCancel: (e: PointerEvent) => void
  onWheel: (e: WheelEvent) => void
  handleBackdropClick: () => Promise<void> | undefined
}

export type InternalLightboxContext = Omit<
  LightboxController,
  'open' | 'openById' | 'activeIndex' | 'photos' | 'activePhoto'
> & {
  /** `source` is the element the visitor activated; it wins over the lookup for that photo. */
  open(index?: number, source?: HTMLElement | null): Promise<void>
  photos: ComputedRef<ResolvedPhotoItem[]>
  activePhoto: ComputedRef<ResolvedPhotoItem | null>
  activeIndex: ComputedRef<number>
} & LightboxRuntimeState &
  LightboxDomBindings

export type LightboxSlideRenderer<TMeta extends object = Readonly<Record<string, unknown>>> =
  (props: { photo: ResolvedPhotoItem<TMeta>; index: number }) => VNodeChild

/**
 * The public controller that `useLightbox()` returns. A photo group provides it before its
 * viewer has loaded; `provideLightbox()` provides the viewer's own.
 */
export const LightboxControllerKey: InjectionKey<LightboxController> = Symbol(
  'nuxt-photo:lightbox-controller',
)

export const LightboxContextKey: InjectionKey<InternalLightboxContext> =
  Symbol('nuxt-photo:lightbox')
export const LightboxSlideRendererKey: InjectionKey<
  (photo: ResolvedPhotoItem) => LightboxSlideRenderer | null
> = Symbol('nuxt-photo:lightbox-slide-renderer')

/** ID-to-element map that `PhotoTrigger` fills for a renderless `LightboxProvider`. */
export const LightboxThumbnailRegistryKey: InjectionKey<Map<string, HTMLElement>> = Symbol(
  'nuxt-photo:lightbox-thumbnails',
)
