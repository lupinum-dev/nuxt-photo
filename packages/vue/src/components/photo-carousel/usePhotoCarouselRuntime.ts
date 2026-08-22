import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import type { PhotoCarouselAutoplayOptions, PhotoItem } from '../../core/index'

export function validatePhotoCarouselBehavior(options: {
  loop?: boolean
  dragFree?: boolean
  direction?: 'ltr' | 'rtl'
}) {
  if (options.loop !== undefined && typeof options.loop !== 'boolean') {
    throw new TypeError('[nuxt-photo] PhotoCarousel loop must be boolean')
  }
  if (options.dragFree !== undefined && typeof options.dragFree !== 'boolean') {
    throw new TypeError('[nuxt-photo] PhotoCarousel dragFree must be boolean')
  }
  if (options.direction !== undefined && !['ltr', 'rtl'].includes(options.direction)) {
    throw new TypeError('[nuxt-photo] PhotoCarousel direction must be "ltr" or "rtl"')
  }
}

export function validatePhotoCarouselAutoplayOptions(
  autoplay: boolean | PhotoCarouselAutoplayOptions,
) {
  if (typeof autoplay === 'boolean') return
  if (
    autoplay.delayMs !== undefined &&
    (!Number.isFinite(autoplay.delayMs) || autoplay.delayMs <= 0)
  ) {
    throw new RangeError(
      '[nuxt-photo] PhotoCarousel autoplay.delayMs must be a positive finite number',
    )
  }
  for (const field of ['stopOnInteraction', 'stopOnMouseEnter'] as const) {
    if (autoplay[field] !== undefined && typeof autoplay[field] !== 'boolean') {
      throw new TypeError(`[nuxt-photo] PhotoCarousel autoplay.${field} must be boolean`)
    }
  }
}

type CarouselRuntimeConfig = {
  photos: Readonly<Ref<readonly PhotoItem[]>>
  loop: Readonly<Ref<boolean | undefined>>
  dragFree: Readonly<Ref<boolean | undefined>>
  direction: Readonly<Ref<'ltr' | 'rtl' | undefined>>
  autoplay: Readonly<Ref<boolean | PhotoCarouselAutoplayOptions>>
  showThumbnails: Readonly<Ref<boolean>>
}

/** Own both stable Embla instances and expose one slide-per-snap state model. */
export function usePhotoCarouselRuntime(config: CarouselRuntimeConfig) {
  const inheritedDirection = ref<'ltr' | 'rtl'>('ltr')
  const effectiveDirection = computed(() => config.direction.value ?? inheritedDirection.value)
  const optionsRef = computed<EmblaOptionsType>(() => {
    validatePhotoCarouselBehavior({
      loop: config.loop.value,
      dragFree: config.dragFree.value,
      direction: config.direction.value,
    })
    return {
      loop: config.loop.value ?? false,
      dragFree: config.dragFree.value ?? false,
      direction: effectiveDirection.value,
      slidesToScroll: 1,
      align: 'start',
      containScroll: 'keepSnaps',
    }
  })
  const pluginsRef = computed(() => {
    const autoplay = config.autoplay.value
    validatePhotoCarouselAutoplayOptions(autoplay)
    if (!autoplay) return []
    const options = typeof autoplay === 'object' ? autoplay : {}
    const delay = options.delayMs === undefined ? {} : { delay: options.delayMs }
    return [
      Autoplay({
        ...delay,
        stopOnInteraction: options.stopOnInteraction ?? true,
        stopOnMouseEnter: options.stopOnMouseEnter ?? false,
      }),
    ]
  })
  const thumbsOptionsRef = computed<EmblaOptionsType>(() => ({
    containScroll: 'keepSnaps',
    direction: effectiveDirection.value,
    dragFree: true,
    slidesToScroll: 1,
  }))

  const [emblaRef, emblaApi] = useEmblaCarousel(optionsRef, pluginsRef)
  const [thumbsRef, thumbsApi] = useEmblaCarousel(thumbsOptionsRef)

  const selectedIndex = ref(0)
  const selectedSnapIndex = ref(0)
  const snapTargets = ref<readonly number[]>([])
  const canPrev = ref(false)
  const canNext = ref(false)

  const selectedSlideSet = computed(() => new Set([selectedIndex.value]))
  const snapCount = computed(() => snapTargets.value.length)
  const snaps = computed(() => snapTargets.value)

  onMounted(() => {
    if (config.direction.value || !emblaRef.value) return
    inheritedDirection.value = getComputedStyle(emblaRef.value).direction === 'rtl' ? 'rtl' : 'ltr'
  })

  function syncThumbs() {
    if (!config.showThumbnails.value) return
    thumbsApi.value?.scrollTo(selectedIndex.value)
  }

  function syncState(api: EmblaCarouselType, forcedIndex?: number) {
    const maxIndex = Math.max(0, config.photos.value.length - 1)
    const selected = Math.min(Math.max(forcedIndex ?? api.selectedScrollSnap(), 0), maxIndex)
    selectedSnapIndex.value = selected
    selectedIndex.value = selected
    snapTargets.value = api.scrollSnapList().map((_, index) => index)
    canPrev.value = api.canScrollPrev()
    canNext.value = api.canScrollNext()
  }

  function handleSelect(api: EmblaCarouselType) {
    syncState(api)
    syncThumbs()
  }

  watch(
    [emblaApi, config.autoplay],
    ([api]) => {
      if (!api) return
      const onSelect = (currentApi: EmblaCarouselType) => handleSelect(currentApi)
      const onReinit = (currentApi: EmblaCarouselType) => handleSelect(currentApi)
      onReinit(api)
      api.on('select', onSelect)
      api.on('reInit', onReinit)
      return () => {
        api.off('select', onSelect)
        api.off('reInit', onReinit)
      }
    },
    { immediate: true },
  )

  function clampSlideIndex(index: number) {
    const max = Math.max(0, config.photos.value.length - 1)
    return Math.min(Math.max(index, 0), max)
  }

  function goTo(index: number, instant = false) {
    const target = clampSlideIndex(index)
    const api = emblaApi.value
    if (!api) {
      selectedIndex.value = target
      selectedSnapIndex.value = target
      return
    }
    api.scrollTo(target, instant)
    if (instant) {
      syncState(api, target)
      syncThumbs()
    }
  }

  function goToNext(instant = false) {
    const api = emblaApi.value
    if (!api) return goTo(selectedIndex.value + 1, instant)
    api.scrollNext(instant)
    if (instant) handleSelect(api)
  }

  function goToPrev(instant = false) {
    const api = emblaApi.value
    if (!api) return goTo(selectedIndex.value - 1, instant)
    api.scrollPrev(instant)
    if (instant) handleSelect(api)
  }

  function selectedSnap() {
    return emblaApi.value?.selectedScrollSnap() ?? selectedSnapIndex.value
  }

  function reInit() {
    emblaApi.value?.reInit()
  }

  onBeforeUnmount(() => {
    emblaApi.value?.destroy()
    thumbsApi.value?.destroy()
  })

  return {
    emblaRef,
    emblaApi,
    thumbsRef,
    thumbsApi,
    selectedIndex,
    selectedSnapIndex,
    selectedSlideSet,
    snapCount,
    snaps,
    canPrev,
    canNext,
    goTo,
    goToNext,
    goToPrev,
    selectedSnap,
    reInit,
  }
}
