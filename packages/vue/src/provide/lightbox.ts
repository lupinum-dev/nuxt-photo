import { provide } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import {
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
  },
) {
  provide(LightboxContextKey, ctx)
  provide(LightboxSlideRendererKey, options?.resolveSlide ?? (() => null))
}
