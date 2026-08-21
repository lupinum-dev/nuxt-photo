import { computed, onBeforeUnmount, ref, watch, type CSSProperties, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType } from 'embla-carousel'
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
  const emblaOptions = ref({ loop: true, duration: 25, startSnap: 0 })

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)

  const currentPhoto = computed<PhotoItem | null>(
    () => photos.value[activeIndex.value] ?? photos.value[0] ?? null,
  )

  watch(
    emblaApi,
    (api) => {
      if (!api) return

      api.on('select', (_api: EmblaCarouselType) => {
        const newIndex = _api.selectedScrollSnap()
        activeIndex.value = newIndex
      })

      api.on('pointerDown', () => {
        if (isZoomedIn() || isInteractionLocked()) return false
      })
    },
    { immediate: true },
  )

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
    emblaApi.value?.scrollNext()
  }

  function goToPrev() {
    emblaApi.value?.scrollPrev()
  }

  function goTo(index: number, instant = false) {
    emblaOptions.value = { ...emblaOptions.value, startSnap: index }
    activeIndex.value = index
    emblaApi.value?.scrollTo(index, instant)
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
