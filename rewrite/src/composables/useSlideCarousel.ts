import { computed, ref, type CSSProperties, type Ref } from 'vue'
import type { AreaMetrics, Photo, SlideView } from '../types'
import { fitRect, getLoopedIndex } from '../utils/geometry'
import { animateNumber } from '../utils/animation'
import type { DebugLogger } from './useDebug'

const slideDurationMs = 260

export function useSlideCarousel(
  photos: Photo[],
  areaMetrics: Ref<AreaMetrics | null>,
  debug?: DebugLogger,
) {
  const activeIndex = ref(0)
  const slideDragOffset = ref(0)

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

  function resolveSlideTarget(dragDelta: number, velocityX: number) {
    const width = areaMetrics.value?.width ?? 0
    const threshold = width * 0.18

    if (dragDelta <= -threshold || velocityX <= -0.45) return 1
    if (dragDelta >= threshold || velocityX >= 0.45) return -1
    return 0
  }

  async function animateSlideTo(targetOffset: number, duration = slideDurationMs) {
    const start = slideDragOffset.value
    await animateNumber(start, targetOffset, duration, (value) => {
      slideDragOffset.value = value
    })
  }

  async function commitSlideChange(direction: number) {
    if (!direction) return

    const fromIndex = activeIndex.value
    const toIndex = getLoopedIndex(activeIndex.value + direction, photos.length)
    debug?.log('slides', `commitSlideChange: direction=${direction} index=${fromIndex}→${toIndex} photo="${photos[toIndex]?.title}"`)

    const width = areaMetrics.value?.width ?? 0
    if (!width) {
      activeIndex.value = toIndex
      return
    }

    await animateSlideTo(direction > 0 ? -width : width)
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
    resolveSlideTarget,
    animateSlideTo,
    commitSlideChange,
  }
}
