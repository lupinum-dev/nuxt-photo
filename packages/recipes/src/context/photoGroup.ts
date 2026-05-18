import type { ComputedRef, InjectionKey } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import type { LightboxSlideRenderer } from '@nuxt-photo/vue'

export interface PhotoGroupContext {
  /** 'auto' = photos collected from child Photo registrations; 'explicit' = :photos prop provided */
  mode: ComputedRef<'auto' | 'explicit'>
  register(
    id: symbol,
    photo: PhotoItem,
    getThumbEl: () => HTMLElement | null,
    renderSlide?: LightboxSlideRenderer | null,
  ): void
  unregister(id: symbol): void
  open(index?: number): Promise<void>
  openPhoto(photo: PhotoItem): Promise<void>
  openById(id: string | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol(
  'nuxt-photo:photo-group',
)
