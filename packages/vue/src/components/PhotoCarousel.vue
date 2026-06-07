<template>
  <CarouselLayoutHost
    v-bind="{ ...$attrs, ...layoutProps }"
    :lightbox="resolvedLightbox"
    :transition="props.transition"
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
    <template v-if="$slots.prev" #prev>
      <slot name="prev" />
    </template>
    <template v-if="$slots.next" #next>
      <slot name="next" />
    </template>
    <template v-if="$slots.dots" #dots="slotProps">
      <slot name="dots" v-bind="slotProps" />
    </template>
  </CarouselLayoutHost>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import Autoplay, { type AutoplayOptionsType } from 'embla-carousel-autoplay'
import type { EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import type { PhotoMapper, ImageAdapter, PhotoItem } from '../core/index'
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
  LightboxTransitionOption,
} from '../core/index'
import CarouselLayoutHost from './internal/CarouselLayoutHost'
import { resolveRecipePhotos } from '../utils/photos'
import { devWarn } from '../utils/runtime'

defineOptions({ inheritAttrs: false })

defineSlots<{
  slide?: (props: CarouselSlideSlotProps) => unknown
  thumb?: (props: CarouselThumbSlotProps) => unknown
  caption?: (props: CarouselCaptionSlotProps) => unknown
  controls?: (props: CarouselControlsSlotProps) => unknown
  prev?: () => unknown
  next?: () => unknown
  dots?: (props: CarouselDotsSlotProps) => unknown
}>()

const props = withDefaults(
  defineProps<{
    photos: readonly unknown[]
    itemMapper?: PhotoMapper
    validation?: InvalidPhotoPolicy
    onInvalidPhotos?: (event: InvalidPhotosEvent) => void
    imageAdapter?: ImageAdapter

    options?: EmblaOptionsType
    plugins?: EmblaPluginType[]
    thumbsOptions?: EmblaOptionsType

    showArrows?: boolean
    showThumbnails?: boolean
    showCounter?: boolean
    showDots?: boolean
    autoplay?: boolean | AutoplayOptionsType

    slideSize?: string
    slideAspect?: string
    gap?: string
    thumbSize?: string

    lightbox?: boolean | Component
    transition?: LightboxTransitionOption

    slideClass?: string
    imgClass?: string
    thumbClass?: string
    captionClass?: string
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

const resolvedPhotos = computed<PhotoItem[]>(() =>
  resolveRecipePhotos(props.photos, props.itemMapper, 'PhotoCarousel', {
    validation: props.validation,
    onInvalidPhotos: props.onInvalidPhotos,
  }),
)

const hasLightbox = computed(
  () => props.lightbox !== undefined && props.lightbox !== false,
)
const resolvedLightbox = computed(() =>
  hasLightbox.value ? props.lightbox : false,
)

const defaultMainOptions: EmblaOptionsType = {
  loop: false,
  align: 'start',
  containScroll: 'trimSnaps',
}
const defaultThumbsOptions: EmblaOptionsType = {
  containScroll: 'keepSnaps',
  dragFree: true,
}

const mergedOptions = computed<EmblaOptionsType>(() => ({
  ...defaultMainOptions,
  ...(props.options ?? {}),
}))
const mergedThumbsOptions = computed<EmblaOptionsType>(() => ({
  ...defaultThumbsOptions,
  ...(props.thumbsOptions ?? {}),
}))

const mergedPlugins = computed<EmblaPluginType[]>(() => {
  const user = props.plugins ?? []
  const autoplay = props.autoplay
  if (!autoplay) return user.slice()

  const filtered = user.filter((p) => p?.name !== 'autoplay')
  if (filtered.length !== user.length) {
    devWarn(
      'PhotoCarousel: `autoplay` prop is set, so a user-supplied Autoplay plugin was dropped. Pass only one of them.',
    )
  }

  const opts = typeof autoplay === 'object' ? autoplay : undefined
  return [Autoplay(opts), ...filtered]
})

const layoutProps = computed(() => ({
  photos: resolvedPhotos.value,
  imageAdapter: props.imageAdapter,
  options: mergedOptions.value,
  plugins: mergedPlugins.value,
  thumbsOptions: mergedThumbsOptions.value,
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
