<template>
  <CarouselLayout
    v-bind="{ ...$attrs, ...layoutProps }"
    :on-slide-activate="provider ? openSlide : undefined"
    :set-slide-ref="provider?.setThumbnailRef"
  >
    <template v-if="$slots.slide" #slide="slotProps">
      <slot name="slide" v-bind="slotProps" />
    </template>
    <template v-if="$slots.thumb" #thumb="slotProps">
      <slot name="thumb" v-bind="slotProps" />
    </template>
    <template v-if="$slots.caption" #caption="slotProps">
      <slot name="caption" v-bind="slotProps" />
    </template>
    <template v-if="$slots.controls" #controls="slotProps">
      <slot name="controls" v-bind="slotProps" />
    </template>
    <template v-if="$slots.prev" #prev><slot name="prev" /></template>
    <template v-if="$slots.next" #next><slot name="next" /></template>
    <template v-if="$slots.dots" #dots="slotProps">
      <slot name="dots" v-bind="slotProps" />
    </template>
  </CarouselLayout>

  <component :is="lightboxComponent" v-if="lightboxComponent" />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed, inject, type Component } from 'vue'
import type { ImageAdapter, PhotoCarouselAutoplayOptions, PhotoItem } from '../core/index'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
} from '../types/index'
import type {
  InvalidPhotoPolicy,
  InvalidPhotosEvent,
  LightboxNavigationMode,
  LightboxTransitionOption,
} from '../core/index'
import { provideLightbox } from '../composables/index'
import { LightboxComponentKey } from '../provide/keys'
import CarouselLayout from './photo-carousel/CarouselLayout.vue'
import Lightbox from './Lightbox.vue'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import { useRecipePhotos } from './shared/useRecipePhotos'

defineOptions({ inheritAttrs: false })

defineSlots<{
  slide?: (props: CarouselSlideSlotProps<TMeta>) => unknown
  thumb?: (props: CarouselThumbSlotProps<TMeta>) => unknown
  caption?: (props: CarouselCaptionSlotProps<TMeta>) => unknown
  controls?: (props: CarouselControlsSlotProps) => unknown
  prev?: () => unknown
  next?: () => unknown
  dots?: (props: CarouselDotsSlotProps) => unknown
}>()

const props = withDefaults(
  defineProps<{
    /**
     * Slides in order. Each needs a stable `id`, a `src`, and the real pixel `width` and `height`.
     */
    photos: readonly PhotoItem<TMeta>[]
    /**
     * What to do with invalid photos: `'throw'` stops with an error, `'drop'` skips them and emits
     * `invalidPhotos`.
     * @default 'throw'
     */
    validation?: InvalidPhotoPolicy
    /** Image adapter for this component. Wins over `ImageAdapterKey` and the module default. */
    imageAdapter?: ImageAdapter<TMeta>
    /**
     * Continue from the last slide to the first.
     * @default false
     */
    loop?: boolean
    /**
     * Let the track stop between slides after a drag.
     * @default false
     */
    dragFree?: boolean
    /**
     * `'ltr'` or `'rtl'`. When omitted, read from the document once at mount; bind it when the
     * direction can change.
     */
    direction?: 'ltr' | 'rtl'
    /**
     * Show the previous and next buttons.
     * @default true
     */
    showArrows?: boolean
    /**
     * Show the thumbnail rail.
     * @default true
     */
    showThumbnails?: boolean
    /**
     * Show the slide counter.
     * @default true
     */
    showCounter?: boolean
    /**
     * Show one dot per slide.
     * @default false
     */
    showDots?: boolean
    /**
     * `true`, or `{ delayMs, stopOnInteraction, stopOnMouseEnter }`. Defaults: 4000 ms, stop after
     * interaction, keep playing on mouse enter. Shows a pause button, and does not run while the
     * reader prefers reduced motion.
     * @default false
     */
    autoplay?: boolean | PhotoCarouselAutoplayOptions
    /**
     * CSS width of each slide, for example `'70%'` to show part of the next slide. Each slide stays
     * one snap.
     */
    slideSize?: string
    /** CSS `aspect-ratio` of each slide, for example `'16/9'`. */
    slideAspect?: string
    /** CSS gap between slides, for example `'12px'`. */
    gap?: string
    /** Thumbnail height as a CSS length. The width follows each photo's aspect ratio. */
    thumbSize?: string
    /**
     * `true` opens the built-in lightbox when a slide is selected, a component replaces it. Off by
     * default. Read once at mount; change the component `key` to remount.
     * @default false
     */
    lightbox?: boolean | Component
    /**
     * How the lightbox opens and closes. `'auto'` animates from the thumbnail when enough of it is
     * visible and fades otherwise. Also `'flip'`, `'fade'`, `'none'`, or an options object. Can
     * change while mounted.
     * @default 'auto'
     */
    transition?: LightboxTransitionOption
    /**
     * How the lightbox changes photos: `'slide'`, `'fade'`, or `'crossfade'`. Can change while
     * mounted.
     * @default 'slide'
     */
    navigation?: LightboxNavigationMode
    /** Classes for each slide. */
    slideClass?: string
    /** Classes for each `<img>`. */
    imgClass?: string
    /** Classes for each thumbnail. */
    thumbClass?: string
    /** Classes for the caption. */
    captionClass?: string
    /** Classes for the controls wrapper. */
    controlsClass?: string
  }>(),
  {
    showArrows: true,
    showThumbnails: true,
    showCounter: true,
    showDots: false,
    autoplay: false,
    lightbox: false,
  },
)

const emit = defineEmits<{
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const resolvedPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoCarousel',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)

const injectedLightbox = inject(LightboxComponentKey, null)
const lightboxComponent = resolveLightboxComponent(
  props.lightbox,
  injectedLightbox,
  Lightbox,
  false,
)
const hasLightbox = lightboxComponent !== null
warnOnSetupOptionChanges('PhotoCarousel', {
  lightbox: () => props.lightbox,
})
const provider = hasLightbox
  ? provideLightbox(resolvedPhotos, {
      transition: () => props.transition,
      navigation: () => props.navigation,
      imageAdapter: computed(() => props.imageAdapter),
    })
  : null

async function openSlide(index: number) {
  await provider?.open(index)
}

const layoutProps = computed(() => ({
  photos: resolvedPhotos.value,
  imageAdapter: props.imageAdapter,
  loop: props.loop,
  dragFree: props.dragFree,
  direction: props.direction,
  autoplay: props.autoplay,
  showArrows: props.showArrows,
  showThumbnails: props.showThumbnails,
  showCounter: props.showCounter,
  showDots: props.showDots,
  slideSize: props.slideSize,
  slideAspect: props.slideAspect,
  gap: props.gap,
  thumbSize: props.thumbSize,
  slideClass: props.slideClass,
  imgClass: props.imgClass,
  thumbClass: props.thumbClass,
  captionClass: props.captionClass,
  controlsClass: props.controlsClass,
}))
</script>
