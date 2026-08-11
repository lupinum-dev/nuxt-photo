import { provide } from 'vue'
import type { PhotoItem } from '../core/index'
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
  },
) {
  provide(LightboxContextKey, ctx)
  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
  provide(ImageAdapterKey, (photo, context) => ctx.imageAdapter.value(photo, context))
}
