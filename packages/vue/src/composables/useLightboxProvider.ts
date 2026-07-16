import { computed, toValue, type MaybeRef } from 'vue'
import type { ImageAdapter, LightboxTransitionOption, PhotoItem } from '../core/index'
import { normalizePhotos } from '../core/photo/normalize'
import { useLightboxRuntimeState } from '../lightbox/runtime'
import { createLightboxController } from '../lightbox/controller'
import type { LightboxProviderController, LightboxSlideRenderer } from '../provide/keys'
import { provideLightboxContexts } from '../provide/lightbox'

/**
 * Creates a full lightbox context and provides it to child components.
 * This is the composable for providing context to custom lightbox components.
 * It is the supported advanced entrypoint above the internal lightbox state.
 *
 * @example
 * ```vue
 * <script setup>
 * const { open, close, isOpen, activePhoto } = useLightboxProvider(photos)
 * </script>
 * <template>
 *   <LightboxRoot>
 *     <LightboxOverlay />
 *     <LightboxViewport v-slot="{ photos, viewportRef }">
 *       <!-- custom slide rendering -->
 *     </LightboxViewport>
 *   </LightboxRoot>
 * </template>
 * ```
 */
export function useLightboxProvider(
  photosInput: MaybeRef<PhotoItem | readonly PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
    imageAdapter?: ImageAdapter
  },
): LightboxProviderController {
  const photos = computed(() => {
    const value = toValue(photosInput)
    return normalizePhotos(Array.isArray(value) ? value : [value], {
      owner: 'useLightboxProvider',
      onInvalid: 'throw',
    }).photos
  })
  const ctx = useLightboxRuntimeState(
    photos,
    options?.transition,
    options?.minZoom,
    options?.imageAdapter,
  )

  // Provide the shared lightbox context plus custom slide resolution.
  provideLightboxContexts(ctx, {
    resolveSlide: options?.resolveSlide,
    imageAdapter: options?.imageAdapter,
  })

  return {
    ...createLightboxController(ctx),
    setThumbnailRef: ctx.setThumbRef,
    hiddenThumbnailIndex: ctx.hiddenThumbIndex,
  }
}
