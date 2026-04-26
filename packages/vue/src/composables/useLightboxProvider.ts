import type { MaybeRef } from 'vue'
import { devWarn, photoId, type PhotoItem } from '@nuxt-photo/core'
import type { LightboxTransitionOption } from '@nuxt-photo/engine'
import { useLightboxContext } from './useLightboxContext'
import { type LightboxSlideRenderer } from '../provide/keys'
import { provideLightboxContexts } from '../provide/lightbox'

/**
 * Creates a full lightbox context and provides it to child components.
 * This is the composable for building custom lightbox components.
 * It is the supported advanced entrypoint above the internal lightbox runtime.
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
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
  },
) {
  const ctx = useLightboxContext(
    photosInput,
    options?.transition,
    options?.minZoom,
  )

  // Provide the shared lightbox context plus custom slide resolution.
  provideLightboxContexts(ctx, {
    resolveSlide: options?.resolveSlide,
  })

  function open(index = 0) {
    return ctx.open(index)
  }

  function openPhoto(photo: PhotoItem) {
    return ctx.open(photo)
  }

  function openById(id: string | number) {
    const index = ctx.photos.value.findIndex(
      (photo) => photoId(photo) === String(id),
    )
    if (index < 0) {
      devWarn(`No photo found for id "${String(id)}"`)
      return Promise.resolve()
    }
    return ctx.open(index)
  }

  return {
    open,
    openPhoto,
    openById,
    close: ctx.close,
    next: ctx.next,
    prev: ctx.prev,
    isOpen: ctx.isOpen,
    activeIndex: ctx.activeIndex,
    activePhoto: ctx.activePhoto,
    photos: ctx.photos,
    count: ctx.count,
    setThumbRef: ctx.setThumbRef,
    hiddenThumbIndex: ctx.hiddenThumbIndex,
  }
}
