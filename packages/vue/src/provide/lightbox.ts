import { provide } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import {
  ImageAdapterKey,
  LightboxContextKey,
  type LightboxContext,
  LightboxSlideRendererKey,
  type LightboxSlideRenderer,
} from './keys'

/** Provide the shared lightbox context plus the optional custom slide resolver. */
export function provideLightboxContexts(
  ctx: LightboxContext,
  options?: {
    resolveSlide?: (photo: PhotoItem) => LightboxSlideRenderer | null
    imageAdapter?: ImageAdapter
  },
) {
  provide(LightboxContextKey, ctx)
  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
  if (options?.imageAdapter) {
    provide(ImageAdapterKey, options.imageAdapter)
  }
}
