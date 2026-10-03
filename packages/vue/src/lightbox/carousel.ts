import { onBeforeUnmount, ref, shallowRef, watch, type CSSProperties, type Ref } from 'vue'
import type { GalleryRuntime } from '../gallery/runtime'
import { createGalleryEmblaBridge } from '../gallery/embla'
import EmblaCarousel, { type EmblaCarouselType } from 'embla-carousel'
import {
  fitRect,
  type AreaMetrics,
  type LightboxNavigationMode,
  type PhotoItem,
} from '../core/index'

type CarouselOptions = {
  isZoomedIn: () => boolean
  isInteractionLocked: () => boolean
  navigationMode: () => LightboxNavigationMode
  isReducedMotion: () => boolean
  /** Called when the active photo changes by navigation in a fade mode. */
  onNavigate: (from: number, to: number) => void
}

/**
 * Bind slide navigation to the active lightbox photo collection.
 *
 * In `slide` mode Embla owns a full-screen swipe track. The fade modes keep the
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
  const bridge = createGalleryEmblaBridge(gallery)
  const emblaOptions = ref({ loop: true, duration: 25, startIndex: 0 })

  const emblaRef = shallowRef<HTMLElement>()
  const emblaApi = shallowRef<EmblaCarouselType>()

  const currentPhoto = gallery.activePhoto

  watch([emblaRef, options.navigationMode, gallery.direction], ([node, mode]) => {
    emblaApi.value?.destroy()
    emblaApi.value = undefined
    if (!node || mode !== 'slide') return

    const api = EmblaCarousel(node, {
      ...emblaOptions.value,
      startIndex: activeIndex.value,
      direction: gallery.direction.value,
      watchSlides: bridge.beforeReinit,
      watchResize: bridge.beforeReinit,
    })
    api.on('select', bridge.select)
    api.on('reInit', (api) => bridge.sync(api, true, true))
    bridge.sync(api, true, true)
    api.on('pointerDown', () => {
      if (options.isZoomedIn() || options.isInteractionLocked()) return false
    })
    emblaApi.value = api
  })

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
    }
  }

  function goToNext() {
    goTo(activeIndex.value + 1)
  }
  function goToPrev() {
    goTo(activeIndex.value - 1)
  }

  /** Show the photo at `index`. `instant` skips motion, for opening and collection changes. */
  function goTo(index: number, instant = false) {
    const count = photos.value.length
    if (count === 0) return
    const target = ((index % count) + count) % count
    const from = activeIndex.value
    gallery.requestIndex(target)
    const api = emblaApi.value
    if (api) bridge.sync(api, instant || options.isReducedMotion())
    else emblaOptions.value = { ...emblaOptions.value, startIndex: target }
    if (options.navigationMode() !== 'slide' && !instant && from !== target) {
      options.onNavigate(from, target)
    }
  }

  function selectedSnap(): number {
    return activeIndex.value
  }
  watch(activeIndex, () => {
    if (emblaApi.value) bridge.sync(emblaApi.value, options.isReducedMotion())
  })

  onBeforeUnmount(() => {
    emblaApi.value?.destroy()
  })

  return {
    emblaRef,
    emblaApi,
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
