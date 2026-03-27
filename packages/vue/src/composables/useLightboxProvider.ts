import { provide, type MaybeRef } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { useLightboxContext, type LightboxTransitionOption } from './useLightboxContext'
import { LightboxContextKey, LightboxSlideRendererKey, type LightboxSlideRenderer } from '../provide/keys'
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

  return {
    open: ctx.open,
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
