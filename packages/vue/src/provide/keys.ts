import type { InjectionKey, ComputedRef, Ref } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import type { useLightbox } from '../composables/useLightbox'

export type LightboxContext = ReturnType<typeof useLightbox>

export const LightboxContextKey: InjectionKey<LightboxContext> = Symbol('LightboxContext')
export const ImageAdapterKey: InjectionKey<ImageAdapter> = Symbol('nuxt-photo:image-adapter')

export interface PhotoGroupContext {
  register(id: symbol, photo: PhotoItem, getThumbEl: () => HTMLElement | null): void
  unregister(id: symbol): void
  open(photoOrIndex: PhotoItem | number): Promise<void>
  photos: ComputedRef<PhotoItem[]>
  hiddenPhoto: ComputedRef<PhotoItem | null>
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> = Symbol('nuxt-photo:photo-group')
