import { computed, onMounted, ref, watch, type ComputedRef } from 'vue'
import type { InvalidPhotoPolicy, InvalidPhotosEvent, PhotoItem } from '../../core/index'
import { resolveRecipePhotos } from '../../core/photo/resolve'

export function useRecipePhotos<TMeta extends object>(
  photos: () => readonly PhotoItem<TMeta>[],
  owner: string,
  validation: () => InvalidPhotoPolicy | undefined,
  reportInvalid: (event: InvalidPhotosEvent) => void,
): ComputedRef<readonly PhotoItem<TMeta>[]> {
  const resolution = computed(() =>
    resolveRecipePhotos<TMeta>(photos(), owner, { validation: validation() }),
  )
  const reportingReady = ref(false)

  onMounted(() => {
    reportingReady.value = true
  })

  watch(
    [() => resolution.value.invalidPhotos, reportingReady],
    ([event, ready]) => {
      if (ready && event) reportInvalid(event)
    },
    { flush: 'post' },
  )

  return computed(() => resolution.value.photos)
}
