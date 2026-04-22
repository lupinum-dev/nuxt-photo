import type { MaybeRef } from 'vue'
import { photoId, type PhotoItem } from '@nuxt-photo/core'
import type { LightboxTransitionOption } from '@nuxt-photo/engine'
import { useLightboxContext } from './useLightboxContext'
import { type LightboxSlideRenderer } from '../provide/keys'
import { provideLightboxContexts } from '../provide/lightbox'

/**
 * Creates a full lightbox context and provides it to child components.
 * This is the composable for building custom lightbox components — the middle tier
 * between `useLightbox` (for consumers) and raw `useLightboxContext` (full engine).
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

  // Provide the unified context + deprecated individual keys for backward compat
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
    return ctx.open(index >= 0 ? index : 0)
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
