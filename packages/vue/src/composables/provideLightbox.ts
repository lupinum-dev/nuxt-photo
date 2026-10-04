import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { LightboxNavigationMode, LightboxTransitionOption, PhotoItem } from '../core/index'
import { normalizePhotos } from '../core/photo/normalize'
import { useLightboxRuntimeState } from '../lightbox/runtime'
import { createLightboxController } from '../lightbox/controller'
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
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
    navigation?: MaybeRefOrGetter<LightboxNavigationMode | undefined>
    resolveSlide?: (photo: PhotoItem<TMeta>) => LightboxSlideRenderer<TMeta> | null
    minZoom?: number
    validation?: InvalidPhotoPolicy
    component?: LightboxOptions['component']
    history?: boolean
    deepLink?: boolean | string
    tools?: LightboxOptions['tools']
    provider?: MaybeRefOrGetter<PhotoProvider | string | undefined>
  },
): LightboxProviderController<TMeta> {
  const config = providePhotoConfig(() => ({
    provider: toValue(options?.provider),
    lightbox: {
      component: options?.component,
      history: options?.history,
      deepLink: options?.deepLink,
      tools: options?.tools,
      transition: toValue(options?.transition),
      navigation: toValue(options?.navigation),
      minZoom: options?.minZoom,
    },
    validation: options?.validation,
  }))
  const photos = computed(() => {
    const value = toValue(photosInput)
    return normalizePhotos<TMeta>(Array.isArray(value) ? value : [value], {
      owner: 'provideLightbox',
      onInvalid: config.value.validation,
      resolveDimensions: config.value.dimensions,
    }).photos
  })
  const ctx = useLightboxRuntimeState(
    photos,
    options?.transition,
    options?.minZoom,
    options?.navigation,
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
