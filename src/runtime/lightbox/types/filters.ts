import type {
  LightboxItem,
  ContentInstance,
  Bounds,
} from './index'

/**
 * Lightbox Filters Map
 */
export interface LightboxFiltersMap {
  numItems: (numItems: number) => number
  itemData: (itemData: LightboxItem, index: number) => LightboxItem
  placeholderSrc: (placeholderSrc: string | false, content: ContentInstance) => string | false
  isContentLoading: (isContentLoading: boolean, content: ContentInstance) => boolean
  isContentZoomable: (isContentZoomable: boolean, content: ContentInstance) => boolean
  useContentPlaceholder: (useContentPlaceholder: boolean, content: ContentInstance) => boolean
  isKeepingPlaceholder: (isKeepingPlaceholder: boolean, content: ContentInstance) => boolean
  contentErrorElement: (contentErrorElement: HTMLElement, content: ContentInstance) => HTMLElement
  thumbEl: (thumbnail: HTMLElement | null | undefined, itemData: LightboxItem, index: number) => HTMLElement | null | undefined
  thumbBounds: (thumbBounds: Bounds | undefined, itemData: LightboxItem, index: number) => Bounds | undefined
  srcsetSizesWidth: (srcsetSizesWidth: number, content: ContentInstance) => number
  preventPointerEvent: (preventPointerEvent: boolean, event: PointerEvent, pointerType: string) => boolean
}

export interface Filter<T extends keyof LightboxFiltersMap> {
  fn: LightboxFiltersMap[T]
  priority: number
}
