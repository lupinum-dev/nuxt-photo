import type { ComputedRef, InjectionKey } from 'vue'
import type { PhotoItem } from '../../core/index'
import type { LightboxSlideRenderer } from '../../provide/keys'

export interface PhotoGroupContext {
  readonly enabled: boolean
  register(
    id: symbol,
    photo: PhotoItem,
    getThumbnailElement: () => HTMLElement | null,
    renderSlide?: LightboxSlideRenderer | null,
  ): void
  unregister(id: symbol): void
  open(index?: number): Promise<void>
  openById(id: string): Promise<void>
  readonly photos: ComputedRef<readonly PhotoItem[]>
  readonly hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol(
  'nuxt-photo:photo-group',
)
