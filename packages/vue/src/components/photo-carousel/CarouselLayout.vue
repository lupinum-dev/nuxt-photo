<template>
  <div v-if="photos.length === 0" class="np-carousel np-carousel--empty" v-bind="$attrs" />

  <div v-else class="np-carousel" :style="cssVarStyle" v-bind="$attrs">
    <div ref="emblaRef" class="np-carousel__viewport">
      <div class="np-carousel__container">
        <div
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="np-carousel__slide"
          :class="slideClass"
          v-bind="interactiveAttrs(photo, index)"
        >
          <div
            :ref="setSlideRef ? setSlideElRef(index) : undefined"
            style="width: 100%; height: 100%"
          >
            <slot
              name="slide"
              :photo="photo"
              :index="index"
              :selected="selectedSlideSet.has(index)"
              :open="() => onSlideActivate?.(index)"
            >
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

      <div
        v-if="showMultiControls && (showArrows || showCounter)"
        class="np-carousel__controls"
        :class="controlsClass"
      >
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
      <slot
        name="caption"
        :photo="photos[selectedIndex]"
        :index="selectedIndex"
        :count="photos.length"
      >
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
            :key="photo.id"
            type="button"
            class="np-carousel__thumb"
            :class="[{ 'np-carousel__thumb--selected': selectedSlideSet.has(index) }, thumbClass]"
            :aria-label="`Go to slide ${index + 1}`"
            :aria-current="selectedSlideSet.has(index) ? 'true' : undefined"
            @click="goTo(index)"
          >
            <slot
              name="thumb"
              :photo="photo"
              :index="index"
              :selected="selectedSlideSet.has(index)"
              :go-to="goTo"
            >
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
import { computed, toRef, useSlots, type ComponentPublicInstance } from 'vue'
import { PhotoImage } from '../../primitives/index'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
} from '../../types/index'
import type {
  ImageAdapter,
  PhotoCarouselAutoplayOptions,
  PhotoCarouselOptions,
  PhotoItem,
} from '../../core/index'
import { createPhotoTriggerBindings } from '../shared/photoTriggerBindings'
import { usePhotoCarouselRuntime } from './usePhotoCarouselRuntime'

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
  options: PhotoCarouselOptions
  autoplay: boolean | PhotoCarouselAutoplayOptions

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

  // Optional lightbox activation and transition-source integration.
  onSlideActivate?: (index: number) => void | Promise<void>
  setSlideRef?: (index: number) => (el: Element | ComponentPublicInstance | null) => void
}>()

const slots = useSlots()
const {
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
} = usePhotoCarouselRuntime({
  photos: toRef(props, 'photos'),
  options: toRef(props, 'options'),
  autoplay: toRef(props, 'autoplay'),
  showThumbnails: toRef(props, 'showThumbnails'),
})

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

function setSlideElRef(index: number) {
  return (el: Element | ComponentPublicInstance | null) => {
    props.setSlideRef?.(index)(el)
  }
}

function interactiveAttrs(photo: PhotoItem, index: number) {
  if (!props.onSlideActivate) return {}
  return {
    ...createPhotoTriggerBindings(
      photo,
      index,
      async () => props.onSlideActivate?.(index),
      `Open slide ${index + 1}`,
    ),
    style: { cursor: 'pointer' },
    'data-index': index,
  }
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
</script>
