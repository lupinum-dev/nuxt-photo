import { computed, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel'
import Autoplay from 'embla-carousel-autoplay'
import type { GalleryRuntime } from '../../gallery/runtime'
import { createGalleryEmblaBridge } from '../../gallery/embla'
import type { PhotoCarouselAutoplayOptions, PhotoItem } from '../../core/index'

export function validatePhotoCarouselBehavior(options: { loop?: boolean; dragFree?: boolean }) {
  if (options.loop !== undefined && typeof options.loop !== 'boolean') {
    throw new TypeError('[nuxt-photo] PhotoCarousel loop must be boolean')
  }
  if (options.dragFree !== undefined && typeof options.dragFree !== 'boolean') {
    throw new TypeError('[nuxt-photo] PhotoCarousel dragFree must be boolean')
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
  gallery: GalleryRuntime
  autoplay: Readonly<Ref<boolean | PhotoCarouselAutoplayOptions>>
  showThumbnails: Readonly<Ref<boolean>>
}

/** Own both stable Embla instances and expose one slide-per-snap state model. */
export function usePhotoCarouselRuntime(config: CarouselRuntimeConfig) {
  const gallery = config.gallery
  const bridge = createGalleryEmblaBridge(gallery)
  const effectiveDirection = gallery.direction
  const optionsRef = computed<EmblaOptionsType>(() => {
    validatePhotoCarouselBehavior({
      loop: config.loop.value,
      dragFree: config.dragFree.value,
    })
    return {
      loop: config.loop.value ?? false,
      dragFree: config.dragFree.value ?? false,
      direction: effectiveDirection.value,
      watchSlides: bridge.beforeReinit,
      watchResize: bridge.beforeReinit,
      slidesToScroll: 1,
      align: 'start',
      containScroll: 'keepSnaps',
    }
  })
  // Autoplay moves content on its own, so it does not run for readers who ask
  // for reduced motion. The preference can change while the page is open.
  const reducedMotion = ref(false)
  const motionQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const syncReducedMotion = () => {
    reducedMotion.value = motionQuery?.matches ?? false
  }
  onMounted(() => {
    syncReducedMotion()
    motionQuery?.addEventListener('change', syncReducedMotion)
  })
  onBeforeUnmount(() => motionQuery?.removeEventListener('change', syncReducedMotion))

  const autoplayAvailable = computed(() => !!config.autoplay.value && !reducedMotion.value)
  const autoplayPlaying = ref(false)
  // Embla restarts autoplay whenever it reinitializes (resize, new slides), so a
  // reader's pause has to be remembered here and applied again.
  let pausedByReader = false

  const pluginsRef = computed(() => {
    const autoplay = config.autoplay.value
    validatePhotoCarouselAutoplayOptions(autoplay)
    if (!autoplay || reducedMotion.value) return []
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

  const selectedIndex = gallery.activeIndex
  const selectedSnapIndex = gallery.activeIndex
  const snapTargets = ref<readonly number[]>([])
  const canPrev = ref(false)
  const canNext = ref(false)

  const selectedSlideSet = computed(() => new Set([selectedIndex.value]))
  const snapCount = computed(() => snapTargets.value.length)
  const snaps = computed(() => snapTargets.value)

  function syncThumbs() {
    if (!config.showThumbnails.value) return
    thumbsApi.value?.scrollTo(selectedIndex.value)
  }

  function syncState(api: EmblaCarouselType) {
    snapTargets.value = api.scrollSnapList().map((_, index) => index)
    canPrev.value = api.canScrollPrev()
    canNext.value = api.canScrollNext()
  }

  function handleSelect(api: EmblaCarouselType) {
    bridge.select(api)
    syncState(api)
    syncThumbs()
  }

  watch(
    [emblaApi, config.autoplay],
    ([api]) => {
      if (!api) return
      const onSelect = (currentApi: EmblaCarouselType) => handleSelect(currentApi)
      const onReinit = (currentApi: EmblaCarouselType) => {
        bridge.sync(currentApi, true, true)
        syncState(currentApi)
        syncThumbs()
      }
      onReinit(api)
      // Embla emits these events before `isPlaying()` changes, so take the state from the event.
      const readAutoplay = () => {
        const autoplay = api.plugins().autoplay
        if (pausedByReader && autoplay?.isPlaying()) autoplay.stop()
        autoplayPlaying.value = autoplay?.isPlaying() ?? false
      }
      const onPlay = () => (autoplayPlaying.value = true)
      const onStop = () => (autoplayPlaying.value = false)
      readAutoplay()
      api.on('select', onSelect)
      api.on('reInit', onReinit)
      api.on('reInit', readAutoplay)
      api.on('autoplay:play', onPlay)
      api.on('autoplay:stop', onStop)
      return () => {
        api.off('select', onSelect)
        api.off('reInit', onReinit)
        api.off('reInit', readAutoplay)
        api.off('autoplay:play', onPlay)
        api.off('autoplay:stop', onStop)
      }
    },
    { immediate: true },
  )

  function clampSlideIndex(index: number) {
    const max = Math.max(0, config.photos.value.length - 1)
    return Math.min(Math.max(index, 0), max)
  }

  function goTo(index: number, instant = false) {
    gallery.requestIndex(clampSlideIndex(index))
    if (emblaApi.value) {
      bridge.sync(emblaApi.value, instant)
      syncState(emblaApi.value)
    }
    syncThumbs()
  }
  function goToNext(instant = false) {
    const index = selectedIndex.value + 1
    goTo(config.loop.value && index >= config.photos.value.length ? 0 : index, instant)
  }
  function goToPrev(instant = false) {
    const index = selectedIndex.value - 1
    goTo(config.loop.value && index < 0 ? config.photos.value.length - 1 : index, instant)
  }
  watch(gallery.activeIndex, () => {
    if (emblaApi.value) {
      bridge.sync(emblaApi.value)
      syncState(emblaApi.value)
    }
    syncThumbs()
  })

  /** Pause or resume autoplay from a visible control (WCAG 2.2.2). */
  function toggleAutoplay() {
    const autoplay = emblaApi.value?.plugins().autoplay
    if (!autoplay) return
    pausedByReader = autoplay.isPlaying()
    if (pausedByReader) autoplay.stop()
    else autoplay.play()
  }

  function selectedSnap() {
    return selectedIndex.value
  }

  function reInit() {
    emblaApi.value?.reInit({ startIndex: gallery.activeIndex.value })
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
    autoplayAvailable,
    autoplayPlaying,
    toggleAutoplay,
  }
}
