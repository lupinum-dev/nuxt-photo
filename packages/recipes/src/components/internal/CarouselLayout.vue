<template>
  <div v-if="photos.length === 0" class="np-carousel np-carousel--empty" v-bind="$attrs" />

  <div v-else class="np-carousel" :style="cssVarStyle" v-bind="$attrs">
    <div ref="emblaRef" class="np-carousel__viewport">
      <div class="np-carousel__container">
        <div
          v-for="(photo, index) in photos"
          :key="photoId(photo)"
          class="np-carousel__slide"
          :class="slideClass"
          v-bind="interactiveAttrs(photo, index)"
        >
          <div
            :ref="setSlideRef ? setSlideElRef(index) : undefined"
            style="width:100%;height:100%"
          >
          <slot name="slide" :photo="photo" :index="index" :selected="selectedSlideSet.has(index)" :open="() => onSlideActivate?.(index)">
              <PhotoImage
                :photo="photo"
                context="slide"
                :image-adapter="imageAdapter"
                :loading="index === 0 ? 'eager' : 'lazy'"
                class="np-carousel__media"
                :class="imgClass"
              />
            </slot>
          </div>
        </div>
      </div>

      <div v-if="showMultiControls && (showArrows || showCounter)" class="np-carousel__controls" :class="controlsClass">
        <template v-if="showArrows">
          <slot
            name="controls"
            :go-to-prev="goToPrev"
            :go-to-next="goToNext"
            :can-go-to-prev="canPrev"
            :can-go-to-next="canNext"
            :selected-index="selectedIndex"
            :snap-count="snapCount"
            :go-to="goTo"
          >
            <button
              type="button"
              class="np-carousel__arrow np-carousel__arrow--prev"
              :disabled="!canPrev"
              aria-label="Previous slide"
              @click="goToPrev()"
            >
              <slot name="prev">‹</slot>
            </button>
            <button
              type="button"
              class="np-carousel__arrow np-carousel__arrow--next"
              :disabled="!canNext"
              aria-label="Next slide"
              @click="goToNext()"
            >
              <slot name="next">›</slot>
            </button>
          </slot>
        </template>
        <template v-else>
          <span />
          <span />
        </template>
      </div>

      <div v-if="showMultiControls && showCounter" class="np-carousel__counter" aria-live="polite">
        {{ selectedIndex + 1 }} / {{ photos.length }}
      </div>
    </div>

    <div v-if="hasCaption" class="np-carousel__caption" :class="captionClass">
      <slot name="caption" :photo="photos[selectedIndex]" :index="selectedIndex" :count="photos.length">
        {{ photos[selectedIndex]?.caption }}
      </slot>
    </div>

    <div v-if="showMultiControls && showDots" class="np-carousel__dots">
      <slot name="dots" :snaps="snaps" :selected-index="selectedSnapIndex" :go-to="goTo">
        <button
          v-for="(slideIndex, i) in snaps"
          :key="i"
          type="button"
          class="np-carousel__dot"
          :class="{ 'np-carousel__dot--selected': i === selectedSnapIndex }"
          :aria-label="`Go to slide ${slideIndex + 1}`"
          :aria-current="i === selectedSnapIndex ? 'true' : undefined"
          @click="goTo(slideIndex)"
        />
      </slot>
    </div>

    <div v-if="showMultiControls && showThumbnails" class="np-carousel__thumbs">
      <div ref="thumbsRef" class="np-carousel__thumbs-viewport">
        <div class="np-carousel__thumbs-container">
          <button
            v-for="(photo, index) in photos"
            :key="photoId(photo)"
            type="button"
            class="np-carousel__thumb"
            :class="[{ 'np-carousel__thumb--selected': selectedSlideSet.has(index) }, thumbClass]"
            :aria-label="`Go to slide ${index + 1}`"
            :aria-current="selectedSlideSet.has(index) ? 'true' : undefined"
            @click="goTo(index)"
          >
            <slot name="thumb" :photo="photo" :index="index" :selected="selectedSlideSet.has(index)" :go-to="goTo">
              <PhotoImage
                :photo="photo"
                context="thumb"
                :image-adapter="imageAdapter"
                loading="lazy"
                class="np-carousel__thumb-img"
              />
            </slot>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, useSlots, watch, type ComponentPublicInstance } from 'vue'
import useEmblaCarousel from 'embla-carousel-vue'
import type { EmblaCarouselType, EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import { PhotoImage } from '@nuxt-photo/vue'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
} from '@nuxt-photo/vue'
import { photoId, type ImageAdapter, type PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })

defineSlots<{
  slide?: (props: CarouselSlideSlotProps) => unknown
  controls?: (props: CarouselControlsSlotProps) => unknown
  caption?: (props: CarouselCaptionSlotProps) => unknown
  dots?: (props: CarouselDotsSlotProps) => unknown
  thumb?: (props: CarouselThumbSlotProps) => unknown
  prev?: () => unknown
  next?: () => unknown
}>()

const props = defineProps<{
  photos: PhotoItem[]
  imageAdapter?: ImageAdapter
  options: EmblaOptionsType
  plugins: EmblaPluginType[]
  thumbsOptions: EmblaOptionsType

  showArrows: boolean
  showThumbnails: boolean
  showCounter: boolean
  showDots: boolean

  slideSize?: string
  slideAspect?: string
  gap?: string
  thumbSize?: string

  slideClass?: string
  imgClass?: string
  thumbClass?: string
  captionClass?: string
  controlsClass?: string

  // Lightbox integration (only provided when wrapped in <PhotoGroup>)
  onSlideActivate?: (index: number) => void
  setSlideRef?: ((index: number) => (el: Element | ComponentPublicInstance | null) => void)
}>()

const slots = useSlots()

const optionsRef = toRef(props, 'options')
const pluginsRef = toRef(props, 'plugins')
const thumbsOptionsRef = toRef(props, 'thumbsOptions')

const [emblaRef, emblaApi] = useEmblaCarousel(optionsRef, pluginsRef)
const [thumbsRef, thumbsApi] = useEmblaCarousel(thumbsOptionsRef)

const selectedIndex = ref(0)
const selectedSnapIndex = ref(0)
const selectedSlides = ref<number[]>([])
const snapCount = ref(0)
const snapTargets = ref<number[]>([])
const canPrev = ref(false)
const canNext = ref(false)
const snaps = computed(() => snapTargets.value)
const selectedSlideSet = computed(() => new Set(selectedSlides.value))

const showMultiControls = computed(() => props.photos.length > 1)

const hasCaption = computed(() => {
  if (slots.caption) return props.photos.length > 0
  return !!props.photos[selectedIndex.value]?.caption
})

const cssVarStyle = computed(() => {
  const vars: Record<string, string> = {}
  if (props.slideSize) vars['--np-carousel-slide-size'] = props.slideSize
  if (props.slideAspect) vars['--np-carousel-slide-aspect'] = props.slideAspect
  if (props.gap) vars['--np-carousel-gap'] = props.gap
  if (props.thumbSize) vars['--np-carousel-thumb-size'] = props.thumbSize
  return vars
})

function fallbackSlidesBySnap() {
  const slidesToScroll = props.options.slidesToScroll
  const chunkSize = typeof slidesToScroll === 'number' && slidesToScroll > 1 ? slidesToScroll : 1
  const groups: number[][] = []

  for (let start = 0; start < props.photos.length; start += chunkSize) {
    groups.push(Array.from({ length: Math.min(chunkSize, props.photos.length - start) }, (_, offset) => start + offset))
  }

  return groups
}

function getSnapState(api: EmblaCarouselType) {
  const scrollSnapList = api.internalEngine().scrollSnapList
  const slidesBySnap = scrollSnapList.slidesBySnap.length ? scrollSnapList.slidesBySnap : fallbackSlidesBySnap()
  const snapBySlide = Object.keys(scrollSnapList.snapBySlide).length
    ? scrollSnapList.snapBySlide
    : Object.fromEntries(slidesBySnap.flatMap((slides, snapIndex) => slides.map(slideIndex => [slideIndex, snapIndex])))
  const snapTotal = api.snapList().length || slidesBySnap.length

  return {
    slidesBySnap,
    snapBySlide,
    snapTotal,
  }
}

function syncThumbs(api: EmblaCarouselType) {
  if (!props.showThumbnails) return
  thumbsApi.value?.goTo(selectedIndex.value)
}

function syncAutoplay(api: EmblaCarouselType) {
  if (!props.plugins.some(plugin => plugin?.name === 'autoplay')) return
  if (api.snapList().length <= 1) return
  api.plugins().autoplay?.play()
}

function syncState(api: EmblaCarouselType, forcedSnap?: number) {
  const { slidesBySnap, snapTotal } = getSnapState(api)
  const maxSnapIndex = Math.max(0, snapTotal - 1)
  const selectedSnap = Math.min(forcedSnap ?? api.selectedSnap(), maxSnapIndex)
  const activeSlides = slidesBySnap[selectedSnap] ?? [selectedSnap]
  const loopEnabled = !!props.options.loop

  selectedSnapIndex.value = selectedSnap
  selectedSlides.value = activeSlides
  selectedIndex.value = activeSlides[0] ?? 0
  snapCount.value = snapTotal
  snapTargets.value = slidesBySnap.map(slides => slides[0] ?? 0)
  canPrev.value = api.snapList().length ? api.canGoToPrev() : (loopEnabled ? snapTotal > 1 : selectedSnap > 0)
  canNext.value = api.snapList().length ? api.canGoToNext() : (loopEnabled ? snapTotal > 1 : selectedSnap < maxSnapIndex)
}

function handleSelect(api: EmblaCarouselType) {
  syncState(api)
  syncThumbs(api)
}

watch(emblaApi, (api) => {
  if (!api) return

  const onSelect = (currentApi: EmblaCarouselType) => {
    handleSelect(currentApi)
  }
  const onReinit = (currentApi: EmblaCarouselType) => {
    handleSelect(currentApi)
    syncAutoplay(currentApi)
  }

  onReinit(api)
  api.on('select', onSelect)
  api.on('reinit', onReinit)
}, { immediate: true })

watch(() => props.photos.length, () => {
  snapTargets.value = Array.from({ length: props.photos.length }, (_, i) => i)
}, { immediate: true })

function clampIndex(i: number) {
  const max = Math.max(0, props.photos.length - 1)
  return Math.min(Math.max(i, 0), max)
}

function goTo(index: number, instant = false) {
  const target = clampIndex(index)
  const api = emblaApi.value
  if (api) {
    const targetSnap = getSnapState(api).snapBySlide[target] ?? target
    api.goTo(targetSnap, instant)
    if (instant) {
      syncState(api, targetSnap)
      syncThumbs(api)
    }
  }
  else {
    selectedIndex.value = target
    selectedSnapIndex.value = target
    selectedSlides.value = [target]
  }
}

function goToNext(instant = false) {
  const api = emblaApi.value
  if (api) {
    const nextSnap = props.options.loop
      ? (selectedSnapIndex.value + 1) % Math.max(1, snapCount.value)
      : Math.min(selectedSnapIndex.value + 1, Math.max(0, snapCount.value - 1))
    api.goToNext(instant)
    if (instant) {
      syncState(api, nextSnap)
      syncThumbs(api)
    }
    return
  }
  goTo(selectedIndex.value + 1, instant)
}

function goToPrev(instant = false) {
  const api = emblaApi.value
  if (api) {
    const prevSnap = props.options.loop
      ? (selectedSnapIndex.value - 1 + Math.max(1, snapCount.value)) % Math.max(1, snapCount.value)
      : Math.max(selectedSnapIndex.value - 1, 0)
    api.goToPrev(instant)
    if (instant) {
      syncState(api, prevSnap)
      syncThumbs(api)
    }
    return
  }
  goTo(selectedIndex.value - 1, instant)
}

function setSlideElRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    props.setSlideRef?.(index)(el)
  }
}

function interactiveAttrs(_photo: PhotoItem, index: number) {
  if (!props.onSlideActivate) return {}
  return {
    role: 'button',
    tabindex: 0,
    style: { cursor: 'pointer' },
    'aria-label': `Open slide ${index + 1}`,
    onClick: () => props.onSlideActivate?.(index),
    onKeydown: (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        props.onSlideActivate?.(index)
      }
    },
    'data-index': index,
  }
}

function selectedSnap() {
  return emblaApi.value?.selectedSnap() ?? selectedIndex.value
}

function reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]) {
  emblaApi.value?.reInit(options, plugins)
}

defineExpose({
  emblaApi,
  thumbsApi,
  selectedIndex,
  goTo,
  goToNext,
  goToPrev,
  selectedSnap,
  reInit,
})

onBeforeUnmount(() => {
  emblaApi.value?.destroy()
  thumbsApi.value?.destroy()
})
</script>
