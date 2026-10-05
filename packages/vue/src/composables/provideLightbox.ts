import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import type { PhotoItem } from '../core/index'
import { normalizePhotos } from '../core/photo/normalize'
import { useLightboxRuntimeState } from '../lightbox/runtime'
import { createLightboxController } from '../lightbox/controller'
import { providePhotoConfig, type LightboxOptions } from '../config'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
import type { LightboxProviderController, LightboxSlideRenderer } from '../provide/keys'
import { provideLightboxContexts } from '../provide/lightbox'

/** Internal provider shared by recipes and LightboxProvider. */
export function provideLightbox<TMeta extends object = Readonly<Record<string, unknown>>>(
  photosInput: MaybeRefOrGetter<PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]>,
  options?: MaybeRefOrGetter<LightboxOptions & { validation?: InvalidPhotoPolicy }>,
  resolveSlide?: (photo: PhotoItem<TMeta>) => LightboxSlideRenderer<TMeta> | null,
): LightboxProviderController<TMeta> {
  const config = providePhotoConfig(() => {
    const { validation, ...lightbox } = toValue(options) ?? {}
    return { lightbox, validation }
  })
  const photos = computed(() => {
    const value = toValue(photosInput)
    return normalizePhotos<TMeta>(Array.isArray(value) ? value : [value], {
      owner: 'provideLightbox',
      onInvalid: config.value.validation,
      resolveDimensions: config.value.dimensions,
    }).photos
  })
  const ctx = useLightboxRuntimeState(photos)

  // Provide the shared lightbox context plus custom slide resolution.
  provideLightboxContexts(ctx, {
    resolveSlide: resolveSlide as ((photo: PhotoItem) => LightboxSlideRenderer | null) | undefined,
  })

  return {
    ...createLightboxController<TMeta>(ctx),
    setThumbnailRef: ctx.setThumbRef,
    hiddenThumbnailIndex: ctx.hiddenThumbIndex,
  }
}
