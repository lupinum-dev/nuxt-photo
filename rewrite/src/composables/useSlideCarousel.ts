import { computed, ref, watch, type ComputedRef, type CSSProperties, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { AreaMetrics, CarouselConfig, Photo } from '../types'
import { fitRect } from '../utils/geometry'
import type { DebugLogger } from './useDebug'

export function useSlideCarousel(
  photos: Photo[],
  areaMetrics: Ref<AreaMetrics | null>,
  config: CarouselConfig,
  isZoomedIn: ComputedRef<boolean>,
  animating: Ref<boolean>,
  debug?: DebugLogger,
) {
  const activeIndex = ref(0)
  const scrollProgress = ref(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 })

  const currentPhoto = computed<Photo>(() => photos[activeIndex.value] ?? photos[0]!)

  // Wire up Embla events when API becomes available
  watch(emblaApi, (api) => {
    if (!api) return

    api.on('select', (_api, event) => {
      const newIndex = event.detail.targetSnap
      debug?.log('slides', `embla select: ${activeIndex.value}→${newIndex} ("${photos[newIndex]?.title}")`)
      activeIndex.value = newIndex
    })

    api.on('scroll', (_api) => {
      scrollProgress.value = _api.scrollProgress()
    })

    // Block Embla drag when zoomed in or during ghost transitions
    api.on('pointerdown', () => {
      if (isZoomedIn.value || animating.value) {
        debug?.log('gestures', `embla pointerdown blocked (zoomed=${isZoomedIn.value} animating=${animating.value})`)
        return false
      }
    })
  }, { immediate: true })

  function getRelativeFrameRect(photo: Photo, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(
      { left: 0, top: 0, width: area.width, height: area.height },
      photo.width / photo.height,
    )
  }

  function getAbsoluteFrameRect(photo: Photo, area = areaMetrics.value) {
    if (!area) return null
    return fitRect(area, photo.width / photo.height)
  }

  function getSlideFrameStyle(photo: Photo): CSSProperties {
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

    // Calculate distance from current position, handling loop wrapping
    let distance = progress - snapPos
    if (distance > 0.5) distance -= 1
    if (distance < -0.5) distance += 1

    // Normalize: distance of 1/n (one slide away) = slidePosition of 1
    const n = photos.length
    const slidePosition = distance * n

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
    emblaApi.value?.goTo(index, instant)
  }

  function selectedSnap(): number {
    return emblaApi.value?.selectedSnap() ?? activeIndex.value
  }

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
