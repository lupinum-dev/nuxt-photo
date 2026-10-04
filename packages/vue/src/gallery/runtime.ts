import {
  computed,
  getCurrentInstance,
  onMounted,
  shallowRef,
  watch,
  type ComputedRef,
  type Ref,
} from 'vue'
import type { PhotoItem, ResolvedPhotoItem } from '../core/types'

/** Template-ref contract shared by every gallery recipe. Closed handles report null. */
export interface GalleryHandle<TMeta extends object = Readonly<Record<string, unknown>>> {
  open(index?: number): Promise<void>
  openById(id: string): Promise<void>
  close(): Promise<void>
  readonly isOpen: boolean
  readonly activeId: string | null
  readonly activePhoto: PhotoItem<TMeta> | null
}

const runtimes = new WeakMap<object, GalleryRuntime>()

/** One writer for gallery identity and visibility. Transport and input only submit requests. */
export function useGalleryRuntime(
  photos: Readonly<Ref<readonly ResolvedPhotoItem[]>>,
  root?: () => HTMLElement | null,
): GalleryRuntime {
  const instance = getCurrentInstance()
  const existing = instance && runtimes.get(instance)
  if (existing) return existing
  const state = shallowRef({ isOpen: false, activeId: photos.value[0]?.id ?? null })
  const directionState = shallowRef<'ltr' | 'rtl'>('ltr')
  const activeIndex = computed(() =>
    Math.max(
      0,
      photos.value.findIndex((photo) => photo.id === state.value.activeId),
    ),
  )
  const activePhoto = computed(
    () => photos.value.find((photo) => photo.id === state.value.activeId) ?? null,
  )

  function requestIndex(index: number) {
    const photo = photos.value[index]
    if (photo && photo.id !== state.value.activeId)
      state.value = { ...state.value, activeId: photo.id }
  }
  function requestVisibility(isOpen: boolean) {
    state.value = { ...state.value, isOpen }
    if (!isOpen && !activePhoto.value) requestIndex(0)
  }
  function resolveDirection(fallback?: HTMLElement | null) {
    const element =
      root?.() ??
      fallback ??
      (typeof HTMLElement !== 'undefined' && instance?.vnode.el instanceof HTMLElement
        ? instance.vnode.el
        : null)
    directionState.value =
      element &&
      typeof getComputedStyle === 'function' &&
      getComputedStyle(element).direction === 'rtl'
        ? 'rtl'
        : 'ltr'
  }
  // Index changes never decide identity. Keep the id through collection changes and let
  // the lightbox close if that id was removed; closed carousels select the first survivor.
  watch(photos, () => {
    if (!state.value.isOpen && !activePhoto.value) {
      state.value = { isOpen: false, activeId: photos.value[0]?.id ?? null }
    }
  })
  onMounted(() => resolveDirection())
  const runtime = {
    photos,
    isOpen: computed(() => state.value.isOpen),
    activeId: computed(() => state.value.activeId),
    activeIndex,
    activePhoto,
    direction: computed(() => directionState.value),
    requestIndex,
    requestVisibility,
    resolveDirection,
  }
  if (instance) runtimes.set(instance, runtime)
  return runtime
}
export interface GalleryRuntime {
  photos: Readonly<Ref<readonly ResolvedPhotoItem[]>>
  isOpen: ComputedRef<boolean>
  activeId: ComputedRef<string | null>
  activeIndex: ComputedRef<number>
  activePhoto: ComputedRef<ResolvedPhotoItem | null>
  direction: ComputedRef<'ltr' | 'rtl'>
  requestIndex(index: number): void
  requestVisibility(isOpen: boolean): void
  resolveDirection(fallback?: HTMLElement | null): void
}
