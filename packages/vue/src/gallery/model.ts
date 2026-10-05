import { computed, onMounted, ref, watch, type ComputedRef } from 'vue'
import type { PhotoItem } from '../core/types'
import { devWarn } from '../core/env'
import { useAsyncErrorReporter } from '../internal/asyncErrors'

type ModelController = {
  isOpen: ComputedRef<boolean>
  activeId: ComputedRef<string | null>
  activePhoto: ComputedRef<PhotoItem | null>
  openById(id: string): Promise<void>
  close(): Promise<void>
}
/** Map the public nullable id to requests, without a second writable model state. */
export function useGalleryModel(
  owner: string,
  active: () => string | null | undefined,
  photos: () => readonly PhotoItem[],
  controller: ModelController,
  emit: (id: string | null) => void,
) {
  const mounted = ref(false)
  const reportAsyncError = useAsyncErrorReporter()
  let warned = false
  let pendingOpen: Promise<void> | null = null
  onMounted(() => {
    mounted.value = true
  })
  watch(
    [active, mounted],
    ([id, ready]) => {
      if (!ready || id === undefined) return
      if (id === null) {
        if (controller.isOpen.value || pendingOpen)
          reportAsyncError('model-close', controller.close())
        return
      }
      if (!photos().some((photo) => photo.id === id)) {
        if (!warned) {
          devWarn(`${owner} ignored unknown active photo id "${id}"`)
          warned = true
        }
        return
      }
      if (!controller.isOpen.value || controller.activeId.value !== id) {
        const task = controller.openById(id)
        pendingOpen = task
        reportAsyncError(
          'model-open',
          task.finally(() => {
            if (pendingOpen === task) pendingOpen = null
          }),
        )
      }
    },
    { immediate: true },
  )
  const activeId = computed(() => (controller.isOpen.value ? controller.activeId.value : null))
  const activePhoto = computed(() =>
    controller.isOpen.value ? controller.activePhoto.value : null,
  )
  watch(activeId, (id) => emit(id))
  return { activeId, activePhoto }
}
