import {
  computed,
  onBeforeUnmount,
  ref,
  watch,
  type ComputedRef,
  type CSSProperties,
  type Ref,
} from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType } from 'embla-carousel'
import {
  fitRect,
  type AreaMetrics,
  type PhotoItem,
  type DebugLogger,
} from '@nuxt-photo/core'
import type { CarouselConfig } from './lightboxRuntimeTypes'

export function useCarousel(
  photos: ComputedRef<PhotoItem[]>,
  areaMetrics: Ref<AreaMetrics | null>,
  config: CarouselConfig,
  isZoomedIn: ComputedRef<boolean>,
  animating: Ref<boolean>,
  debug?: DebugLogger,
) {
  const activeIndex = ref(0)
  const scrollProgress = ref(0)
  const emblaOptions = ref({ loop: true, duration: 25, startSnap: 0 })

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)

  const currentPhoto = computed<PhotoItem>(
    () => photos.value[activeIndex.value] ?? photos.value[0]!,
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

      api.on('scroll', (_api: EmblaCarouselType) => {
        scrollProgress.value = _api.scrollProgress()
      })

      api.on('pointerdown', () => {
        if (isZoomedIn.value || animating.value) {
          debug?.log(
            'gestures',
            `embla pointerdown blocked (zoomed=${isZoomedIn.value} animating=${animating.value})`,
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

  function getSlideEffectStyle(slideIndex: number): CSSProperties {
    const api = emblaApi.value
    if (!api) return {}

    const snaps = api.snapList()
    if (!snaps.length) return {}

    const progress = scrollProgress.value
    const snapPos = snaps[slideIndex] ?? 0

    let distance = progress - snapPos
    if (distance > 0.5) distance -= 1
    if (distance < -0.5) distance += 1

    const n = photos.value.length
    const slidePosition = distance * n

    // Skip effect computation for slides more than 1.5 positions away — saves CPU per frame
    if (Math.abs(slidePosition) > 1.5) return {}

    switch (config.style) {
      case 'classic':
        return {}

      case 'parallax': {
        const { amount, scale, opacity } = config.parallax
        const absPos = Math.min(1, Math.abs(slidePosition))
        const width = areaMetrics.value?.width ?? 1
        const parallaxShift = slidePosition * amount * width * -1
        const scaleValue = 1 - absPos * (1 - scale)
        const opacityValue = 1 - absPos * (1 - opacity)
        return {
          transform: `translate3d(${parallaxShift}px, 0, 0) scale(${scaleValue})`,
          opacity: String(Math.max(0, opacityValue)),
        }
      }

      case 'fade': {
        const absPos = Math.min(1, Math.abs(slidePosition))
        const opacityValue = Math.max(config.fade.minOpacity, 1 - absPos)
        return {
          opacity: String(opacityValue),
          transform: `translate3d(${slidePosition * 40}px, 0, 0)`,
        }
      }
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
    scrollProgress,

    getRelativeFrameRect,
    getAbsoluteFrameRect,
    getSlideFrameStyle,
    getSlideEffectStyle,

    goToNext,
    goToPrev,
    goTo,
    selectedSnap,
  }
}
