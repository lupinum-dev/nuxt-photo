import {
  computed,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  type CSSProperties,
  type Ref,
} from 'vue'
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
  photos: Readonly<Ref<PhotoItem[]>>,
  areaMetrics: Ref<AreaMetrics | null>,
  frameAreaMetrics: Ref<AreaMetrics | null>,
  options: CarouselOptions,
) {
  const activeIndex = ref(0)
  const emblaOptions = ref({ loop: true, duration: 25, startIndex: 0 })

  const emblaRef = shallowRef<HTMLElement>()
  const emblaApi = shallowRef<EmblaCarouselType>()

  const currentPhoto = computed<PhotoItem | null>(
    () => photos.value[activeIndex.value] ?? photos.value[0] ?? null,
  )

  watch([emblaRef, options.navigationMode], ([node, mode]) => {
    emblaApi.value?.destroy()
    emblaApi.value = undefined
    if (!node || mode !== 'slide') return

    const api = EmblaCarousel(node, { ...emblaOptions.value, startIndex: activeIndex.value })
    api.on('select', (_api) => {
      activeIndex.value = _api.selectedScrollSnap()
    })
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
    const api = emblaApi.value
    if (api && !options.isReducedMotion()) api.scrollNext()
    else goTo(activeIndex.value + 1)
  }

  function goToPrev() {
    const api = emblaApi.value
    if (api && !options.isReducedMotion()) api.scrollPrev()
    else goTo(activeIndex.value - 1)
  }

  /** Show the photo at `index`. `instant` skips motion, for opening and collection changes. */
  function goTo(index: number, instant = false) {
    const count = photos.value.length
    if (count === 0) return
    const target = ((index % count) + count) % count
    const from = activeIndex.value
    activeIndex.value = target
    const api = emblaApi.value
    if (api) api.scrollTo(target, instant || options.isReducedMotion())
    else emblaOptions.value = { ...emblaOptions.value, startIndex: target }
    if (options.navigationMode() !== 'slide' && !instant && from !== target) {
      options.onNavigate(from, target)
    }
  }

  function selectedSnap(): number {
    return emblaApi.value?.selectedScrollSnap() ?? activeIndex.value
  }

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
