import { shallowRef, type CSSProperties, type Ref } from 'vue'
import type { GalleryRuntime } from '../gallery/runtime'
import {
  fitRect,
  type AreaMetrics,
  type LightboxNavigationMode,
  type ResolvedPhotoItem as PhotoItem,
} from '../core/index'

type CarouselOptions = {
  navigationMode: () => LightboxNavigationMode
  isReducedMotion: () => boolean
  /** Called when the active photo changes by navigation in a fade mode. */
  onNavigate: (from: number, to: number) => void
  /** The `slide` mode track: moves to the photo `step` away, or shows the active one at rest. */
  track: () => { go: (step: number, velocity?: number, target?: number) => void; stop: () => void }
}

/**
 * Bind slide navigation to the active lightbox photo collection.
 *
 * In `slide` mode the track moves the photos side by side. The fade modes keep the
 * photos stacked and leave the change to the motion controller. Either way each
 * photo is fitted inside the measured frame area, the mat that themes size through CSS.
 */
export function useCarousel(
  gallery: GalleryRuntime,
  areaMetrics: Ref<AreaMetrics | null>,
  frameAreaMetrics: Ref<AreaMetrics | null>,
  options: CarouselOptions,
) {
  const photos = gallery.photos
  const activeIndex = gallery.activeIndex
  /** The element that clips the slide track; custom lightboxes bind it through `viewportRef`. */
  const trackRef = shallowRef<HTMLElement>()
  const currentPhoto = gallery.activePhoto

  /** The fitted photo rect relative to the media area's top-left corner. */
  function getRelativeFrameRect(photo: PhotoItem) {
    const area = areaMetrics.value
    const frameArea = frameAreaMetrics.value ?? area
    if (!area || !frameArea) return null
    return fitRect(
      {
        left: frameArea.left - area.left,
        top: frameArea.top - area.top,
        width: frameArea.width,
        height: frameArea.height,
      },
      photo.width / photo.height,
    )
  }

  /** The fitted photo rect in viewport coordinates. */
  function getAbsoluteFrameRect(photo: PhotoItem) {
    const frameArea = frameAreaMetrics.value ?? areaMetrics.value
    if (!frameArea) return null
    return fitRect(frameArea, photo.width / photo.height)
  }

  function getSlideFrameStyle(photo: PhotoItem): CSSProperties {
    const area = areaMetrics.value
    const frame = getRelativeFrameRect(photo)
    if (!area || !frame) return { width: '0px', height: '0px' }
    // Slides center their frame; shift it when the mat leaves more room on one side.
    const offsetX = frame.left + frame.width / 2 - area.width / 2
    const offsetY = frame.top + frame.height / 2 - area.height / 2
    return {
      width: `${frame.width}px`,
      height: `${frame.height}px`,
      translate: offsetX || offsetY ? `${offsetX}px ${offsetY}px` : undefined,
      // Where this frame sits in its slide: its caption keeps inside the slide with them.
      '--np-slide-frame-left': `${frame.left}px`,
      '--np-slide-width': `${area.width}px`,
    }
  }

  function goToNext() {
    goTo(activeIndex.value + 1, false, 1)
  }
  function goToPrev() {
    goTo(activeIndex.value - 1, false, -1)
  }

  /**
   * Show the photo at `index`. `instant` skips motion, for opening and collection changes.
   * `step` says which way the track moves; by default the shorter way round.
   */
  function goTo(index: number, instant = false, step?: number) {
    const count = photos.value.length
    if (count === 0) return
    const target = ((index % count) + count) % count
    const from = activeIndex.value
    const slide = options.navigationMode() === 'slide'
    if (instant || !slide || options.isReducedMotion()) {
      if (slide) options.track().stop()
      gallery.requestIndex(target)
      if (!slide && !instant && from !== target) options.onNavigate(from, target)
      return
    }
    const forward = (target - from + count) % count
    const shorter = forward === 1 ? 1 : forward === count - 1 ? -1 : Math.sign(target - from)
    options.track().go(step ?? shorter, 0, target)
  }

  function selectedSnap(): number {
    return activeIndex.value
  }

  return {
    trackRef,
    activeIndex,
    currentPhoto,

    getRelativeFrameRect,
    getAbsoluteFrameRect,
    getSlideFrameStyle,

    goToNext,
    goToPrev,
    goTo,
    selectedSnap,
  }
}
