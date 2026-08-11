import type { PhotoItem } from '../core/index'
import type { Ref } from 'vue'

// ─── Lightbox primitive slot props ─────────────────────────────────────────

export interface LightboxControlsSlotProps<
  TMeta extends object = Readonly<Record<string, unknown>>,
> {
  activeIndex: number
  activePhoto: PhotoItem<TMeta> | null
  photos: readonly PhotoItem<TMeta>[]
  count: number
  isZoomedIn: boolean
  zoomAllowed: boolean
  controlsDisabled: boolean
  next: () => void
  prev: () => void
  close: () => Promise<void>
  toggleZoom: () => void
}

export interface LightboxCaptionSlotProps<
  TMeta extends object = Readonly<Record<string, unknown>>,
> {
  photo: PhotoItem<TMeta> | null
  activeIndex: number
}

export interface LightboxSlideSlotProps<TMeta extends object = Readonly<Record<string, unknown>>> {
  photo: PhotoItem<TMeta>
  index: number
  width: number
  height: number
}

export interface LightboxViewportSlotProps<
  TMeta extends object = Readonly<Record<string, unknown>>,
> {
  photos: readonly PhotoItem<TMeta>[]
  viewportRef: Ref<HTMLElement | null | undefined>
  imageLoadFailed: boolean
}

// ─── PhotoCarousel slot props ──────────────────────────────────────────────

export interface CarouselSlideSlotProps<TMeta extends object = Readonly<Record<string, unknown>>> {
  photo: PhotoItem<TMeta>
  index: number
  selected: boolean
  open: () => void | Promise<void>
}

export interface CarouselThumbSlotProps<TMeta extends object = Readonly<Record<string, unknown>>> {
  photo: PhotoItem<TMeta>
  index: number
  selected: boolean
  goTo: (i: number) => void
}

export interface CarouselCaptionSlotProps<
  TMeta extends object = Readonly<Record<string, unknown>>,
> {
  photo: PhotoItem<TMeta>
  index: number
  count: number
}

export interface CarouselControlsSlotProps {
  goToPrev: () => void
  goToNext: () => void
  canGoToPrev: boolean
  canGoToNext: boolean
  selectedIndex: number
  snapCount: number
  goTo: (i: number) => void
}

export interface CarouselDotsSlotProps {
  snaps: readonly number[]
  selectedIndex: number
  goTo: (i: number) => void
}
