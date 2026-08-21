import type { ComputedRef, Ref } from 'vue'
import type { AreaMetrics, PanState, PhotoItem, ZoomState } from '../../core/index'

export type GestureInputConfig = {
  state: {
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
    settleCurrentTransform: (options?: { tension?: number; friction?: number }) => void
    setPanzoomImmediate: (scale: number, pan: PanState, syncRefs?: boolean) => void
    startPanzoomSpring: (
      targetScale: number,
      targetPan: PanState,
      options?: { tension?: number; friction?: number },
    ) => void
    clampPan: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
    clampPanWithResistance: (pan: PanState, zoom?: number, photo?: PhotoItem) => PanState
    applyWheelZoom: (event: WheelEvent) => void
    toggleZoom: (clientPoint?: { x: number; y: number }) => void
    getPanBounds: (photo: PhotoItem, zoom: number) => { x: number; y: number }
  }
  navigation: {
    goToNext: () => void
    goToPrev: () => void
    goTo: (index: number, instant?: boolean) => void
    selectedSnap: () => number
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
  startX: number
  startY: number
  lastX: number
  lastY: number
  moved: boolean
  startPan: PanState
}

export type GestureSession =
  | { kind: 'idle' }
  | ({ kind: 'tap' | 'slide' | 'pan' | 'close' } & PointerSession)
  | {
      kind: 'pinch'
      pointerIds: readonly [number, number]
      startDistance: number
      startCenter: { x: number; y: number }
      startScale: number
      startPan: PanState
      moved: boolean
    }
