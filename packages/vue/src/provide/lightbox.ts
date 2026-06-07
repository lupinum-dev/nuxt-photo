import { provide } from 'vue'
import type { ImageAdapter, PhotoItem } from '../core/index'
import {
  type InternalLightboxContext,
  ImageAdapterKey,
  LightboxContextKey,
  LightboxSlideRendererKey,
  type LightboxSlideRenderer,
} from './keys'

/** Provide the shared lightbox context plus the optional custom slide resolver. */
export function provideLightboxContexts(
  ctx: InternalLightboxContext,
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
