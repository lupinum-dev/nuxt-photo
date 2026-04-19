import type { PhotoItem } from '@nuxt-photo/core'
import type { Ref } from 'vue'

// ─── Lightbox primitive slot props ─────────────────────────────────────────

export interface LightboxControlsSlotProps {
  activeIndex: number
  activePhoto: PhotoItem | null
  photos: PhotoItem[]
  count: number
  isZoomedIn: boolean
  zoomAllowed: boolean
  controlsDisabled: boolean
  next: () => void
  prev: () => void
  close: () => Promise<void>
  toggleZoom: () => void
}

export interface LightboxCaptionSlotProps {
  photo: PhotoItem | null
  activeIndex: number
}

export interface LightboxSlideSlotProps {
  photo: PhotoItem
  index: number
  width: number
  height: number
}

export interface LightboxViewportSlotProps {
  photos: PhotoItem[]
  viewportRef: Ref<HTMLElement | null | undefined>
  mediaOpacity: number
}

// ─── PhotoCarousel slot props ──────────────────────────────────────────────

export interface CarouselSlideSlotProps {
  photo: PhotoItem
  index: number
  selected: boolean
  open: () => void
}

export interface CarouselThumbSlotProps {
  photo: PhotoItem
  index: number
  selected: boolean
  goTo: (i: number) => void
}

export interface CarouselCaptionSlotProps {
  photo: PhotoItem
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
  snaps: number[]
  selectedIndex: number
  goTo: (i: number) => void
}
