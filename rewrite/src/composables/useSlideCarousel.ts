import { computed, ref, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, CarouselConfig, Photo, SlideView } from '../types'
import { fitRect, getLoopedIndex } from '../utils/geometry'
import { createSpring1D, runSpring, stopSpring, type Spring1D } from '../utils/spring'
import type { DebugLogger } from './useDebug'

export function useSlideCarousel(
  photos: Photo[],
  areaMetrics: Ref<AreaMetrics | null>,
  config: CarouselConfig,
  debug?: DebugLogger,
) {
  const activeIndex = ref(0)
  const slideDragOffset = ref(0)

  const slideSpring: Spring1D = createSpring1D(config.spring.tension, config.spring.friction)

  const currentPhoto = computed<Photo>(() => photos[activeIndex.value] ?? photos[0]!)

  const slideViews = computed<SlideView[]>(() => {
    if (!photos.length) return []

    return ([-1, 0, 1] as const).map((offset) => {
      const index = getLoopedIndex(activeIndex.value + offset, photos.length)
      return {
        photo: photos[index]!,
        index,
        offset,
        isActive: offset === 0,
      }
    })
  })

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

  function getSlideZoomStyle(view: SlideView): CSSProperties {
    return {
      transform: view.isActive ? undefined : 'translate3d(0px, 0px, 0) scale(1)',
    }
  }

  function getSlideEffectStyle(view: SlideView): CSSProperties {
    const width = areaMetrics.value?.width ?? 1
    const progress = slideDragOffset.value / width
    const slidePosition = view.offset + progress

    switch (config.style) {
      case 'classic':
        return {}

      case 'parallax': {
        const { amount, scale, opacity } = config.parallax
        const absPos = Math.min(1, Math.abs(slidePosition))
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

  function resolveSlideTarget(dragDelta: number, velocityX: number) {
    const width = areaMetrics.value?.width ?? 0
    const threshold = width * config.thresholds.distance

    if (dragDelta <= -threshold || velocityX <= -config.thresholds.velocity) return 1
    if (dragDelta >= threshold || velocityX >= config.thresholds.velocity) return -1
    return 0
  }

  function stopSlideSpring() {
    stopSpring(slideSpring)
  }

  function animateSlideTo(targetOffset: number, initialVelocity = 0): Promise<void> {
    return new Promise((resolve) => {
      slideSpring.value = slideDragOffset.value
      slideSpring.target = targetOffset
      slideSpring.velocity = initialVelocity
      slideSpring.tension = config.spring.tension
      slideSpring.friction = config.spring.friction

      debug?.log('slides', `spring: ${slideSpring.value.toFixed(0)}→${targetOffset.toFixed(0)} v=${initialVelocity.toFixed(0)}`)

      runSpring(
        slideSpring,
        (v) => { slideDragOffset.value = v },
        resolve,
      )
    })
  }

  async function commitSlideChange(direction: number, velocityPxPerSec = 0) {
    if (!direction) return

    const fromIndex = activeIndex.value
    const toIndex = getLoopedIndex(activeIndex.value + direction, photos.length)
    debug?.log('slides', `commitSlideChange: direction=${direction} index=${fromIndex}→${toIndex} photo="${photos[toIndex]?.title}"`)

    const width = areaMetrics.value?.width ?? 0
    if (!width) {
      activeIndex.value = toIndex
      return
    }

    await animateSlideTo(direction > 0 ? -width : width, velocityPxPerSec)
    activeIndex.value = toIndex
    slideDragOffset.value = 0
  }

  return {
    activeIndex,
    slideDragOffset,
    currentPhoto,
    slideViews,

    getRelativeFrameRect,
    getAbsoluteFrameRect,
    getSlideFrameStyle,
    getSlideZoomStyle,
    getSlideEffectStyle,
    resolveSlideTarget,
    animateSlideTo,
    commitSlideChange,
    stopSlideSpring,
  }
}
