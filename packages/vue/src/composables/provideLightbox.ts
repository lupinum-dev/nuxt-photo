import { computed, provide, toValue, type MaybeRefOrGetter } from 'vue'
import type { PhotoItem, ResolvedPhotoItem } from '../core/index'
import { normalizePhotos } from '../core/photo/normalize'
import { photoIndexOf } from '../core/photo/lookup'
import { useLightboxRuntimeState } from '../lightbox/runtime'
import { createLightboxController } from '../lightbox/controller'
import { providePhotoConfig, type LightboxOptions } from '../config'
import type { InvalidPhotoPolicy } from '../core/photo/normalize'
import {
  LightboxControllerKey,
  type LightboxProviderController,
  type LightboxSlideRenderer,
} from '../provide/keys'
import type { GalleryRuntime } from '../gallery/runtime'
import { provideLightboxContexts } from '../provide/lightbox'

export type ProvideLightboxParts<TMeta extends object> = {
  /** Custom slide content for a photo, or null for the default slide. */
  resolveSlide?: (photo: ResolvedPhotoItem<TMeta>) => LightboxSlideRenderer<TMeta> | null
  /**
   * Find the page element that shows a photo. The lightbox calls it only when it needs the
   * element (open, close, focus return), so re-rendered thumbnails are still found.
   */
  thumbnailFor?: (id: string) => HTMLElement | null
  /** The identity store of the group that owns this lightbox. */
  gallery?: GalleryRuntime
}

export type ProvidedLightbox<TMeta extends object> = LightboxProviderController<TMeta> & {
  /** Open a photo from the element the visitor activated. */
  readonly activate: (id: string, source: HTMLElement | null) => Promise<void>
}

/** Internal provider shared by recipes and LightboxProvider. */
export function provideLightbox<TMeta extends object = Readonly<Record<string, unknown>>>(
  photosInput: MaybeRefOrGetter<PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]>,
  options?: MaybeRefOrGetter<LightboxOptions & { validation?: InvalidPhotoPolicy }>,
  parts: ProvideLightboxParts<TMeta> = {},
): ProvidedLightbox<TMeta> {
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
  const ctx = useLightboxRuntimeState(photos, {
    thumbnailFor: parts.thumbnailFor,
    gallery: parts.gallery,
  })

  // Provide the shared lightbox context plus custom slide resolution.
  provideLightboxContexts(ctx, {
    resolveSlide: parts.resolveSlide as
      | ((photo: ResolvedPhotoItem) => LightboxSlideRenderer | null)
      | undefined,
  })

  const controller = createLightboxController<TMeta>(ctx)
  provide(LightboxControllerKey, controller)
  return {
    ...controller,
    hiddenThumbnailId: ctx.hiddenThumbnailId,
    async activate(id, source) {
      await ctx.open(photoIndexOf(photos.value, id), source)
    },
  }
}
