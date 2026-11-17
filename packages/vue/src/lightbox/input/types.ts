import type { ComputedRef, Ref } from 'vue'
import type {
  AreaMetrics,
  PanBounds,
  PanState,
  ResolvedPhotoItem as PhotoItem,
  ZoomState,
} from '../../core/index'

export type GestureInputConfig = {
  state: {
    direction?: Readonly<Ref<'ltr' | 'rtl'>>
    isOpen: Readonly<Ref<boolean>>
    animating: Readonly<Ref<boolean>>
    isZoomedIn: ComputedRef<boolean>
    zoomAllowed: ComputedRef<boolean>
    mediaAreaRef: Ref<HTMLElement | null>
    currentPhoto: ComputedRef<PhotoItem | null>
    areaMetrics: Readonly<Ref<AreaMetrics | null>>
    uiVisible: Ref<boolean>
    panState: Readonly<Ref<PanState>>
    zoomState: Readonly<Ref<ZoomState>>
    transitionInProgress: ComputedRef<boolean>
  }
  panzoom: {
    getCurrentScale: () => number
    getCurrentPan: () => PanState
    setCurrentPanImmediate: (pan: PanState, syncRefs?: boolean) => void
    settleCurrentTransform: () => void
    setPanzoomImmediate: (scale: number, pan: PanState, syncRefs?: boolean) => void
    startPanzoomSpring: (
      targetScale: number,
      targetPan: PanState,
      options?: { tension?: number; friction?: number },
    ) => void
    clampPan: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
    clampPanWithResistance: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
    applyWheelZoom: (event: WheelEvent) => void
    isPointOnPhoto: (clientX: number, clientY: number) => boolean
    toggleZoom: (clientPoint?: { x: number; y: number }) => void
    getPanBounds: (photo: PhotoItem, zoom: number) => PanBounds
    getFrameOffset: (photo: PhotoItem) => PanState
  }
  navigation: {
    goToNext: () => void
    goToPrev: () => void
    goTo: (index: number, instant?: boolean) => void
    selectedSnap: () => number
    /** Stop a settling slide under a new pointer. True when there was one to catch. */
    catchSlide: () => boolean
    /** A horizontal drag starts changing photos. */
    beginSlide: () => void
    dragSlide: (deltaX: number) => void
    /**
     * `deltaX` is the distance from where the pointer went down, `leadX` the part of it before
     * the lock that the drag did not draw.
     */
    releaseSlide: (deltaX: number, velocityX: number, pointerType: string, leadX: number) => void
    goToFirst: () => void
    goToLast: () => void
  }
  lifecycle: {
    setCloseDragY: (value: number) => void
    handleCloseGesture: (
      deltaY: number,
      velocityY: number,
      closeFn: () => Promise<void>,
    ) => Promise<void>
    close: () => Promise<void>
    reportAsyncError: (operation: string, task: Promise<unknown>) => void
  }
}

export type TrackedPointer = {
  id: number
  pointerType: string
  clientX: number
  clientY: number
}

type PointerSession = {
  id: number
  pointerType: string
  /** Where the pointer went down. Release decisions and taps measure from here. */
  startX: number
  startY: number
  /**
   * Where the gesture locked its direction. The photo moves by what the pointer moves after
   * this point, so it never jumps to catch up with the slop that decided the direction.
   */
  lockX: number
  lockY: number
  moved: boolean
  startPan: PanState
}

export type GestureSession =
  | { kind: 'idle' }
  | ({ kind: 'tap' | 'slide' | 'pan' | 'close' } & PointerSession)
  | {
      kind: 'pinch'
      startDistance: number
      startCenter: { x: number; y: number }
      startScale: number
      startPan: PanState
      moved: boolean
    }
