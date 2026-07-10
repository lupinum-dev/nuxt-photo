import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import type {
  PhotoCarouselAutoplayOptions,
  PhotoCarouselOptions,
  PhotoItem,
} from '../../core/index'
import { readEmblaSnapModel } from '../../integrations/embla/snapModel'

export function validatePhotoCarouselOptions(options: PhotoCarouselOptions) {
  if (options.loop !== undefined && typeof options.loop !== 'boolean') {
    throw new TypeError(
      '[nuxt-photo] PhotoCarousel options.loop must be boolean',
    )
  }
  if (options.dragFree !== undefined && typeof options.dragFree !== 'boolean') {
    throw new TypeError(
      '[nuxt-photo] PhotoCarousel options.dragFree must be boolean',
    )
  }
  if (
    options.slidesToScroll !== undefined &&
    (!Number.isInteger(options.slidesToScroll) || options.slidesToScroll < 1)
  ) {
    throw new RangeError(
      '[nuxt-photo] PhotoCarousel options.slidesToScroll must be a positive integer',
    )
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
      throw new TypeError(
        `[nuxt-photo] PhotoCarousel autoplay.${field} must be boolean`,
      )
    }
  }
}

type CarouselRuntimeConfig = {
  photos: Readonly<Ref<readonly PhotoItem[]>>
  options: Readonly<Ref<PhotoCarouselOptions>>
  autoplay: Readonly<Ref<boolean | PhotoCarouselAutoplayOptions>>
  showThumbnails: Readonly<Ref<boolean>>
}

/** Own both Embla instances and expose one reconciled carousel state model. */
export function usePhotoCarouselRuntime(config: CarouselRuntimeConfig) {
  const optionsRef = computed<EmblaOptionsType>(() => {
    validatePhotoCarouselOptions(config.options.value)
    return {
      loop: config.options.value.loop ?? false,
      dragFree: config.options.value.dragFree ?? false,
      slidesToScroll: config.options.value.slidesToScroll ?? 1,
      align: 'start',
      containScroll: 'trimSnaps',
    }
  })
  const pluginsRef = computed(() => {
    const autoplay = config.autoplay.value
    validatePhotoCarouselAutoplayOptions(autoplay)
    if (!autoplay) return []
    const options = typeof autoplay === 'object' ? autoplay : {}
    return [
      Autoplay({
        delay: options.delayMs,
        defaultInteraction: options.stopOnInteraction ?? true,
      }),
    ]
  })
  const thumbsOptionsRef = computed<EmblaOptionsType>(() => ({
    containScroll: 'keepSnaps',
    dragFree: true,
  }))

  const [emblaRef, emblaApi] = useEmblaCarousel(optionsRef, pluginsRef)
  const [thumbsRef, thumbsApi] = useEmblaCarousel(thumbsOptionsRef)

  const selectedIndex = ref(0)
  const selectedSnapIndex = ref(0)
  const selectedSlides = ref<readonly number[]>([])
  const snapTargets = ref<readonly number[]>([])
  const snapBySlide = ref<Readonly<Record<number, number>>>({})
  const canPrev = ref(false)
  const canNext = ref(false)

  const selectedSlideSet = computed(() => new Set(selectedSlides.value))
  const snapCount = computed(() => snapTargets.value.length)
  const snaps = computed(() => snapTargets.value)

  function syncThumbs() {
    if (!config.showThumbnails.value) return
    thumbsApi.value?.goTo(selectedIndex.value)
  }

  function syncState(api: EmblaCarouselType, forcedSnap?: number) {
    const model = readEmblaSnapModel(api)
    const maxSnapIndex = Math.max(0, model.slidesBySnap.length - 1)
    const selectedSnap = Math.min(
      Math.max(forcedSnap ?? api.selectedSnap(), 0),
      maxSnapIndex,
    )
    const activeSlides = model.slidesBySnap[selectedSnap] ?? []

    selectedSnapIndex.value = selectedSnap
    selectedSlides.value = activeSlides
    selectedIndex.value = activeSlides[0] ?? 0
    snapTargets.value = model.slidesBySnap.map((slides) => slides[0] ?? 0)
    snapBySlide.value = model.snapBySlide
    canPrev.value = api.canGoToPrev()
    canNext.value = api.canGoToNext()
  }

  function handleSelect(api: EmblaCarouselType) {
    syncState(api)
    syncThumbs()
  }

  watch(
    [emblaApi, config.autoplay],
    ([api]) => {
      if (!api) return

      const onSelect = (currentApi: EmblaCarouselType) => {
        handleSelect(currentApi)
      }
      const onReinit = (currentApi: EmblaCarouselType) => {
        handleSelect(currentApi)
      }

      onReinit(api)
      api.on('select', onSelect)
      api.on('reinit', onReinit)

      const autoplay =
        typeof config.autoplay.value === 'object' ? config.autoplay.value : null
      const root = api.rootNode()
      const stopOnMouseEnter = autoplay?.stopOnMouseEnter === true
      const stopAutoplay = () => api.plugins().autoplay?.stop()
      const resumeAutoplay = () => {
        if (autoplay?.stopOnInteraction === false) {
          api.plugins().autoplay?.play()
        }
      }
      if (stopOnMouseEnter) {
        root.addEventListener('mouseenter', stopAutoplay)
        root.addEventListener('mouseleave', resumeAutoplay)
      }

      return () => {
        api.off('select', onSelect)
        api.off('reinit', onReinit)
        root.removeEventListener('mouseenter', stopAutoplay)
        root.removeEventListener('mouseleave', resumeAutoplay)
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
      selectedSlides.value = [target]
      return
    }

    const targetSnap = snapBySlide.value[target]
    if (targetSnap === undefined) return
    api.goTo(targetSnap, instant)
    if (instant) {
      syncState(api, targetSnap)
      syncThumbs()
    }
  }

  function goToNext(instant = false) {
    const api = emblaApi.value
    if (!api) return goTo(selectedIndex.value + 1, instant)
    api.goToNext(instant)
    if (instant) {
      const target = api.selectedSnap()
      syncState(api, target)
      syncThumbs()
    }
  }

  function goToPrev(instant = false) {
    const api = emblaApi.value
    if (!api) return goTo(selectedIndex.value - 1, instant)
    api.goToPrev(instant)
    if (instant) {
      const target = api.selectedSnap()
      syncState(api, target)
      syncThumbs()
    }
  }

  function selectedSnap() {
    return emblaApi.value?.selectedSnap() ?? selectedSnapIndex.value
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
    selectedSlides,
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
