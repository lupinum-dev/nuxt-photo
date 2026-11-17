import type { ComputedRef, InjectionKey } from 'vue'
import type { PhotoItem } from '../../core/index'
import type { LightboxSlideRenderer } from '../../provide/keys'

/**
 * What a recipe talks to: the surrounding `PhotoGroup`, or a group of its own. Every member
 * addresses photos by ID; a recipe maps its own `photos[index]` to an ID first.
 */
export interface PhotoGroupContext {
  /** False when the group's lightbox is turned off; members then do nothing. */
  readonly enabled: boolean
  readonly hasPhoto: (id: string) => boolean
  /** Open a photo; `source` is the element the visitor activated, if any. */
  readonly activate: (id: string, source?: HTMLElement | null) => Promise<void>
  readonly openById: (id: string) => Promise<void>
  readonly close: () => Promise<void>
  readonly isOpen: ComputedRef<boolean>
  /** The open photo's ID, or null while closed. */
  readonly activeId: ComputedRef<string | null>
  readonly activePhoto: ComputedRef<PhotoItem | null>
  /** ID of the photo whose thumbnails the lightbox animation covers, or null. */
  readonly hiddenId: ComputedRef<string | null>
  readonly replaceCapabilities: (owner: symbol, entries: readonly PhotoGroupCapability[]) => void
  readonly removeCapabilities: (owner: symbol) => void
}

export interface PhotoGroupCapability {
  readonly id: string
  readonly renderSlide?: LightboxSlideRenderer | null
}

export const PhotoGroupContextKey: InjectionKey<PhotoGroupContext> =
  Symbol('nuxt-photo:photo-group')
