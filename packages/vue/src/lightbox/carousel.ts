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
import { fitRect, type AreaMetrics, type PhotoItem } from '../core/index'

/** Keep the swipe track full-screen while fitting each photo inside a gallery mat. */
export function getLightboxFrameArea(area: AreaMetrics): AreaMetrics {
  const compact = area.width < 700
  const horizontalInset = compact ? 12 : Math.min(120, Math.max(48, area.width * 0.06))
  const verticalInset = compact ? 24 : Math.min(80, Math.max(40, area.height * 0.07))

  return {
    left: area.left + horizontalInset,
    top: area.top + verticalInset,
    width: Math.max(0, area.width - horizontalInset * 2),
    height: Math.max(0, area.height - verticalInset * 2),
  }
}

/** Bind Embla-based slide navigation to the active lightbox photo collection. */
export function useCarousel(
  photos: Readonly<Ref<PhotoItem[]>>,
  areaMetrics: Ref<AreaMetrics | null>,
  isZoomedIn: () => boolean,
  isInteractionLocked: () => boolean,
) {
  const activeIndex = ref(0)
  const emblaOptions = ref({ loop: true, duration: 25, startIndex: 0 })

  const emblaRef = shallowRef<HTMLElement>()
  const emblaApi = shallowRef<EmblaCarouselType>()

  const currentPhoto = computed<PhotoItem | null>(
    () => photos.value[activeIndex.value] ?? photos.value[0] ?? null,
  )

  watch(emblaRef, (node) => {
    emblaApi.value?.destroy()
    emblaApi.value = undefined
    if (!node) return

    const api = EmblaCarousel(node, emblaOptions.value)
    api.on('select', (_api) => {
      activeIndex.value = _api.selectedScrollSnap()
    })
    api.on('pointerDown', () => {
      if (isZoomedIn() || isInteractionLocked()) return false
    })
    emblaApi.value = api
  })

  function getRelativeFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    const frameArea = getLightboxFrameArea({
      left: 0,
      top: 0,
      width: area.width,
      height: area.height,
    })
    return fitRect(frameArea, photo.width / photo.height)
  }

  function getAbsoluteFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(getLightboxFrameArea(area), photo.width / photo.height)
  }

  function getSlideFrameStyle(photo: PhotoItem): CSSProperties {
    const frame = getRelativeFrameRect(photo)
    return {
      width: `${frame?.width ?? 0}px`,
      height: `${frame?.height ?? 0}px`,
    }
  }

  function goToNext() {
    const api = emblaApi.value
    if (api) api.scrollNext()
    else goTo(activeIndex.value + 1)
  }

  function goToPrev() {
    const api = emblaApi.value
    if (api) api.scrollPrev()
    else goTo(activeIndex.value - 1)
  }

  function goTo(index: number, instant = false) {
    const count = photos.value.length
    if (count === 0) return
    const target = ((index % count) + count) % count
    activeIndex.value = target
    const api = emblaApi.value
    if (api) api.scrollTo(target, instant)
    else emblaOptions.value = { ...emblaOptions.value, startIndex: target }
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
