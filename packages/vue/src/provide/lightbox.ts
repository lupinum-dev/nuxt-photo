import { provide } from 'vue'
import type { ResolvedPhotoItem } from '../core/index'
import {
  type InternalLightboxContext,
  LightboxContextKey,
  LightboxSlideRendererKey,
  type LightboxSlideRenderer,
} from './keys'

/** Provide the shared lightbox context plus the optional custom slide resolver. */
export function provideLightboxContexts(
  ctx: InternalLightboxContext,
  options?: {
    resolveSlide?: (photo: ResolvedPhotoItem) => LightboxSlideRenderer | null
  },
) {
  provide(LightboxContextKey, ctx)
  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
}
