import { computed, onMounted, ref, watch, type ComputedRef } from 'vue'
import type { InvalidPhotoPolicy, InvalidPhotosEvent, PhotoItem } from '../../core/index'
import { resolveRecipePhotos } from '../../core/photo/resolve'

export function useRecipePhotos<TMeta extends object>(
  photos: () => readonly PhotoItem<TMeta>[],
  owner: string,
  validation: () => InvalidPhotoPolicy | undefined,
  reportInvalid: (event: InvalidPhotosEvent) => void,
): ComputedRef<readonly PhotoItem<TMeta>[]> {
  const resolution = computed(() => {
    try {
      return { result: resolveRecipePhotos<TMeta>(photos(), owner, { validation: validation() }) }
    } catch (error) {
      // Cache the original error as a value so Vue never leaves this computed
      // without a result when an app handles the validation exception.
      return { error }
    }
  })
  const reportingReady = ref(false)

  onMounted(() => {
    reportingReady.value = true
  })

  // Report each validation failure once, independently of mount readiness.
  watch(
    resolution,
    (value) => {
      if (!value.result) throw value.error
    },
    { immediate: true },
  )

  watch(
    [resolution, reportingReady],
    ([value, ready]) => {
      const event = value.result?.invalidPhotos
      if (ready && event) reportInvalid(event)
    },
    { flush: 'post' },
  )

  return computed(() => resolution.value.result?.photos ?? [])
}
