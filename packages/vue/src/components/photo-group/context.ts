import type { ComputedRef, InjectionKey } from 'vue'
import type { PhotoItem } from '../../core/index'
import type { LightboxSlideRenderer } from '../../provide/keys'

export interface PhotoGroupContext {
  readonly enabled: boolean
  replaceCapabilities(owner: symbol, entries: readonly PhotoGroupCapability[]): void
  removeCapabilities(owner: symbol): void
  open(index?: number): Promise<void>
  activateById(id: string, source?: HTMLElement | null): Promise<void>
  hasPhoto(id: string): boolean
  readonly photos: ComputedRef<readonly PhotoItem[]>
  readonly hiddenPhoto: ComputedRef<PhotoItem | null>
}

export interface PhotoGroupCapability {
  readonly id: string
  readonly getThumbnailElement: () => HTMLElement | null
  readonly renderSlide?: LightboxSlideRenderer | null
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> =
  Symbol('nuxt-photo:photo-group')
