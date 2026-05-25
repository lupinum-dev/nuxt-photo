import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
  type CSSProperties,
  type Ref,
} from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType } from 'embla-carousel'
import { fitRect, type AreaMetrics, type PhotoItem } from '@nuxt-photo/core'
import type { DebugLogger } from '../internal/runtime'

/** Bind Embla-based slide navigation to the active lightbox photo collection. */
export function useCarousel(
  photos: Readonly<Ref<PhotoItem[]>>,
  areaMetrics: Ref<AreaMetrics | null>,
  isZoomedIn: () => boolean,
  isInteractionLocked: () => boolean,
  debug?: DebugLogger,
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
        const newIndex = _api.selectedSnap()
        debug?.log('slides', `embla select: ${activeIndex.value}→${newIndex}`)
        activeIndex.value = newIndex
      })

      api.on('pointerdown', () => {
        const zoomed = isZoomedIn()
        const locked = isInteractionLocked()
        if (zoomed || locked) {
          debug?.log(
            'gestures',
            `embla pointerdown blocked (zoomed=${zoomed} locked=${locked})`,
          )
          return false
        }
      })
    },
    { immediate: true },
  )

  function getRelativeFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(
      { left: 0, top: 0, width: area.width, height: area.height },
      photo.width / photo.height,
    )
  }

  function getAbsoluteFrameRect(photo: PhotoItem, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(area, photo.width / photo.height)
  }

  function getSlideFrameStyle(photo: PhotoItem): CSSProperties {
    const frame = getRelativeFrameRect(photo)
    return {
      width: `${frame?.width ?? 0}px`,
      height: `${frame?.height ?? 0}px`,
    }
  }

  function goToNext() {
    emblaApi.value?.goToNext()
  }

  function goToPrev() {
    emblaApi.value?.goToPrev()
  }

  function goTo(index: number, instant = false) {
    emblaOptions.value = { ...emblaOptions.value, startSnap: index }
    activeIndex.value = index
    emblaApi.value?.goTo(index, instant)
  }

  function selectedSnap(): number {
    return emblaApi.value?.selectedSnap() ?? activeIndex.value
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
