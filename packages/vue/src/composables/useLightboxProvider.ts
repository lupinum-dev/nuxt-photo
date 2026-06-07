import type { MaybeRef } from 'vue'
import {
  type ImageAdapter,
  type LightboxTransitionOption,
  type PhotoItem,
} from '../core/index'
import { useLightboxRuntimeState } from './useLightboxRuntimeState'
import { createLightboxController } from './lightboxController'
import { type LightboxSlideRenderer } from '../provide/keys'
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
  photosInput: MaybeRef<PhotoItem | PhotoItem[]>,
  options?: {
    transition?: LightboxTransitionOption
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    minZoom?: number
    imageAdapter?: ImageAdapter
  },
) {
  const ctx = useLightboxRuntimeState(
    photosInput,
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
    setThumbRef: ctx.setThumbRef,
    hiddenThumbIndex: ctx.hiddenThumbIndex,
  }
}
