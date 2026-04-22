import type {
  GestureMode,
  PanState,
  PhotoItem,
  ZoomState,
} from '@nuxt-photo/core'
import {
  createViewerState,
  isViewerOpen,
  viewerTransition,
} from '@nuxt-photo/core'
import type {
  LightboxEngine,
  LightboxEngineListener,
  LightboxEngineState,
} from './types'

const DEFAULT_ZOOM_STATE: ZoomState = {
  fit: 1,
  secondary: 1,
  max: 1,
  current: 1,
}

const DEFAULT_PAN_STATE: PanState = { x: 0, y: 0 }

function clampIndex(index: number, count: number) {
  if (count <= 0) return 0
  return Math.max(0, Math.min(count - 1, index))
}

function getActivePhoto(photos: PhotoItem[], index: number): PhotoItem | null {
  return photos[clampIndex(index, photos.length)] ?? null
}

function createSnapshot(state: LightboxEngineState): LightboxEngineState {
  return {
    ...state,
    photos: state.photos.slice(),
  }
}

export function createLightboxEngine(options?: {
  photos?: PhotoItem[]
  state?: Partial<LightboxEngineState>
}): LightboxEngine {
  let viewer = createViewerState()

  const photos = options?.photos?.slice() ?? []
  const initialIndex = clampIndex(
    options?.state?.activeIndex ?? 0,
    photos.length,
  )

  let state: LightboxEngineState = {
    status: viewer.status,
    photos,
    activeIndex: initialIndex,
    activePhoto: getActivePhoto(photos, initialIndex),
    count: photos.length,
    zoomState: options?.state?.zoomState ?? DEFAULT_ZOOM_STATE,
    panState: options?.state?.panState ?? DEFAULT_PAN_STATE,
    isZoomedIn: options?.state?.isZoomedIn ?? false,
    zoomAllowed: options?.state?.zoomAllowed ?? false,
    gesturePhase:
      options?.state?.gesturePhase ?? ('idle' satisfies GestureMode),
    animating: options?.state?.animating ?? false,
    ghostVisible: options?.state?.ghostVisible ?? false,
    ghostSrc: options?.state?.ghostSrc ?? '',
    hiddenThumbIndex: options?.state?.hiddenThumbIndex ?? null,
    overlayOpacity: options?.state?.overlayOpacity ?? 0,
    mediaOpacity: options?.state?.mediaOpacity ?? 0,
    chromeOpacity: options?.state?.chromeOpacity ?? 0,
    uiVisible: options?.state?.uiVisible ?? true,
    closeDragY: options?.state?.closeDragY ?? 0,
  }

  const listeners = new Set<LightboxEngineListener>()

  function emit() {
    const snapshot = createSnapshot(state)
    for (const listener of listeners) {
      listener(snapshot)
    }
  }

  function syncDerived() {
    state = {
      ...state,
      count: state.photos.length,
      activeIndex: clampIndex(state.activeIndex, state.photos.length),
      activePhoto: getActivePhoto(state.photos, state.activeIndex),
    }
  }

  function patch(next: Partial<LightboxEngineState>) {
    state = { ...state, ...next }
    syncDerived()
    emit()
  }

  function setViewerStatus(nextStatus: LightboxEngineState['status']) {
    patch({
      status: nextStatus,
    })
  }

  return {
    getState() {
      return createSnapshot(state)
    },

    subscribe(listener) {
      listeners.add(listener)
      listener(createSnapshot(state))
      return () => {
        listeners.delete(listener)
      }
    },

    setPhotos(nextPhotos) {
      const currentActiveId = state.activePhoto?.id
      const nextIndex =
        currentActiveId == null
          ? clampIndex(state.activeIndex, nextPhotos.length)
          : Math.max(
              0,
              nextPhotos.findIndex(
                (photo) => String(photo.id) === String(currentActiveId),
              ),
            )

      patch({
        photos: nextPhotos.slice(),
        activeIndex: clampIndex(nextIndex, nextPhotos.length),
      })

      if (state.photos.length === 0 && isViewerOpen(viewer)) {
        viewer = viewerTransition(viewer, { type: 'close' })
        setViewerStatus(viewer.status)
      }
    },

    setActiveIndex(index) {
      const safeIndex = clampIndex(index, state.photos.length)
      const activePhoto = state.photos[safeIndex]
      if (activePhoto) {
        viewer = viewerTransition(viewer, {
          type: 'setActive',
          activeId: activePhoto.id,
        })
      }
      patch({ activeIndex: safeIndex, status: viewer.status })
    },

    open(index = 0) {
      const safeIndex = clampIndex(index, state.photos.length)
      const activePhoto = state.photos[safeIndex]
      if (!activePhoto) {
        return
      }
      viewer = viewerTransition(viewer, {
        type: 'open',
        activeId: activePhoto.id,
      })
      patch({
        activeIndex: safeIndex,
        status: viewer.status,
        uiVisible: true,
      })
    },

    markOpened() {
      viewer = viewerTransition(viewer, { type: 'opened' })
      setViewerStatus(viewer.status)
    },

    close() {
      viewer = viewerTransition(viewer, { type: 'close' })
      setViewerStatus(viewer.status)
    },

    markClosed() {
      viewer = viewerTransition(viewer, { type: 'closed' })
      patch({
        status: viewer.status,
        closeDragY: 0,
        gesturePhase: 'idle',
      })
    },

    next() {
      if (state.count <= 0) return
      const nextIndex = (state.activeIndex + 1) % state.count
      this.setActiveIndex(nextIndex)
    },

    prev() {
      if (state.count <= 0) return
      const nextIndex = (state.activeIndex - 1 + state.count) % state.count
      this.setActiveIndex(nextIndex)
    },

    setZoomState(zoomState) {
      patch({ zoomState })
    },

    setPanState(panState) {
      patch({ panState })
    },

    setZoomFlags(flags) {
      patch(flags)
    },

    setGesturePhase(gesturePhase) {
      patch({ gesturePhase })
    },

    setUiVisible(uiVisible) {
      patch({ uiVisible })
    },

    setAnimating(animating) {
      patch({ animating })
    },

    setGhostState(nextGhostState) {
      patch(nextGhostState)
    },
  }
}
