import { computed, toValue, type MaybeRef, type MaybeRefOrGetter } from 'vue'
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
 * const { open, close, isOpen, activePhoto } = provideLightbox(photos)
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
export function provideLightbox<TMeta extends object = Readonly<Record<string, unknown>>>(
  photosInput: MaybeRefOrGetter<PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]>,
  options?: {
    transition?: MaybeRefOrGetter<LightboxTransitionOption | undefined>
    resolveSlide?: (photo: PhotoItem<TMeta>) => LightboxSlideRenderer<TMeta> | null
    minZoom?: number
    imageAdapter?: MaybeRef<ImageAdapter<TMeta> | undefined>
  },
): LightboxProviderController<TMeta> {
  const photos = computed(() => {
    const value = toValue(photosInput)
    return normalizePhotos<TMeta>(Array.isArray(value) ? value : [value], {
      owner: 'provideLightbox',
      onInvalid: 'throw',
    }).photos
  })
  const ctx = useLightboxRuntimeState(
    photos,
    options?.transition,
    options?.minZoom,
    options?.imageAdapter as MaybeRef<ImageAdapter | undefined>,
  )

  // Provide the shared lightbox context plus custom slide resolution.
  provideLightboxContexts(ctx, {
    resolveSlide: options?.resolveSlide as
      | ((photo: PhotoItem) => LightboxSlideRenderer | null)
      | undefined,
  })

  return {
    ...createLightboxController<TMeta>(ctx),
    setThumbnailRef: ctx.setThumbRef,
    hiddenThumbnailIndex: ctx.hiddenThumbIndex,
  }
}
