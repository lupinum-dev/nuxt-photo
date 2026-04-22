import { computed, onBeforeUnmount, ref } from 'vue'
import type { LightboxEngine } from '@nuxt-photo/engine'

export function useLightboxEngineState(engine: LightboxEngine) {
  const initial = engine.getState()

  const status = ref(initial.status)
  const photos = ref(initial.photos)
  const activeIndex = ref(initial.activeIndex)
  const zoomState = ref(initial.zoomState)
  const panState = ref(initial.panState)
  const isZoomedIn = ref(initial.isZoomedIn)
  const zoomAllowed = ref(initial.zoomAllowed)
  const gesturePhase = ref(initial.gesturePhase)
  const animating = ref(initial.animating)
  const ghostVisible = ref(initial.ghostVisible)
  const ghostSrc = ref(initial.ghostSrc)
  const hiddenThumbIndex = ref(initial.hiddenThumbIndex)
  const overlayOpacity = ref(initial.overlayOpacity)
  const mediaOpacity = ref(initial.mediaOpacity)
  const chromeOpacity = ref(initial.chromeOpacity)
  const uiVisible = ref(initial.uiVisible)
  const closeDragY = ref(initial.closeDragY)

  const unsubscribe = engine.subscribe((next) => {
    status.value = next.status
    photos.value = next.photos
    activeIndex.value = next.activeIndex
    zoomState.value = next.zoomState
    panState.value = next.panState
    isZoomedIn.value = next.isZoomedIn
    zoomAllowed.value = next.zoomAllowed
    gesturePhase.value = next.gesturePhase
    animating.value = next.animating
    ghostVisible.value = next.ghostVisible
    ghostSrc.value = next.ghostSrc
    hiddenThumbIndex.value = next.hiddenThumbIndex
    overlayOpacity.value = next.overlayOpacity
    mediaOpacity.value = next.mediaOpacity
    chromeOpacity.value = next.chromeOpacity
    uiVisible.value = next.uiVisible
    closeDragY.value = next.closeDragY
  })

  onBeforeUnmount(unsubscribe)

  const count = computed(() => photos.value.length)
  const activePhoto = computed(() => photos.value[activeIndex.value] ?? null)
  const isOpen = computed(
    () => status.value === 'opening' || status.value === 'open',
  )

  return {
    status,
    photos,
    count,
    activeIndex,
    activePhoto,
    isOpen,
    zoomState,
    panState,
    isZoomedIn,
    zoomAllowed,
    gesturePhase,
    animating,
    ghostVisible,
    ghostSrc,
    hiddenThumbIndex,
    overlayOpacity,
    mediaOpacity,
    chromeOpacity,
    uiVisible,
    closeDragY,
  }
}
