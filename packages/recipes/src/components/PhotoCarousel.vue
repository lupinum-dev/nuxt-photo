<template>
  <PhotoGroup
    v-if="hasLightbox"
    :photos="resolvedPhotos"
    :lightbox="props.lightbox"
    :transition="props.transition"
  >
    <template #default="{ open, setThumbRef }">
      <CarouselLayout
        ref="layoutRef"
        v-bind="$attrs"
        :photos="resolvedPhotos"
        :adapter="props.adapter"
        :options="mergedOptions"
        :plugins="mergedPlugins"
        :thumbs-options="mergedThumbsOptions"
        :show-arrows="props.showArrows"
        :show-thumbnails="props.showThumbnails"
        :show-counter="props.showCounter"
        :show-dots="props.showDots"
        :slide-size="props.slideSize"
        :slide-aspect="props.slideAspect"
        :gap="props.gap"
        :thumb-size="props.thumbSize"
        :slide-class="props.slideClass"
        :img-class="props.imgClass"
        :thumb-class="props.thumbClass"
        :caption-class="props.captionClass"
        :controls-class="props.controlsClass"
        :on-slide-activate="open"
        :set-slide-ref="setThumbRef"
      >
        <template v-if="$slots.slide" #slide="slotProps"><slot name="slide" v-bind="slotProps" /></template>
        <template v-if="$slots.thumb" #thumb="slotProps"><slot name="thumb" v-bind="slotProps" /></template>
        <template v-if="$slots.caption" #caption="slotProps"><slot name="caption" v-bind="slotProps" /></template>
        <template v-if="$slots.controls" #controls="slotProps"><slot name="controls" v-bind="slotProps" /></template>
        <template v-if="$slots.prev" #prev><slot name="prev" /></template>
        <template v-if="$slots.next" #next><slot name="next" /></template>
        <template v-if="$slots.dots" #dots="slotProps"><slot name="dots" v-bind="slotProps" /></template>
      </CarouselLayout>
    </template>

    <template v-if="$slots['lightbox-slide']" #slide="slotProps"><slot name="lightbox-slide" v-bind="slotProps" /></template>
    <template v-if="$slots['lightbox-caption']" #caption="slotProps"><slot name="lightbox-caption" v-bind="slotProps" /></template>
    <template v-if="$slots['lightbox-toolbar']" #toolbar="slotProps"><slot name="lightbox-toolbar" v-bind="slotProps" /></template>
  </PhotoGroup>

  <CarouselLayout
    v-else
    ref="layoutRef"
    v-bind="$attrs"
    :photos="resolvedPhotos"
    :adapter="props.adapter"
    :options="mergedOptions"
    :plugins="mergedPlugins"
    :thumbs-options="mergedThumbsOptions"
    :show-arrows="props.showArrows"
    :show-thumbnails="props.showThumbnails"
    :show-counter="props.showCounter"
    :show-dots="props.showDots"
    :slide-size="props.slideSize"
    :slide-aspect="props.slideAspect"
    :gap="props.gap"
    :thumb-size="props.thumbSize"
    :slide-class="props.slideClass"
    :img-class="props.imgClass"
    :thumb-class="props.thumbClass"
    :caption-class="props.captionClass"
    :controls-class="props.controlsClass"
  >
    <template v-if="$slots.slide" #slide="slotProps"><slot name="slide" v-bind="slotProps" /></template>
    <template v-if="$slots.thumb" #thumb="slotProps"><slot name="thumb" v-bind="slotProps" /></template>
    <template v-if="$slots.caption" #caption="slotProps"><slot name="caption" v-bind="slotProps" /></template>
    <template v-if="$slots.controls" #controls="slotProps"><slot name="controls" v-bind="slotProps" /></template>
    <template v-if="$slots.prev" #prev><slot name="prev" /></template>
    <template v-if="$slots.next" #next><slot name="next" /></template>
    <template v-if="$slots.dots" #dots="slotProps"><slot name="dots" v-bind="slotProps" /></template>
  </CarouselLayout>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import Autoplay, { type AutoplayOptionsType } from 'embla-carousel-autoplay'
import type { EmblaOptionsType, EmblaPluginType, EmblaCarouselType } from 'embla-carousel'
import type { PhotoAdapter, PhotoItem, ImageAdapter } from '@nuxt-photo/core'
import type { LightboxTransitionOption } from '@nuxt-photo/vue/extend'
import PhotoGroup from './PhotoGroup.vue'
import CarouselLayout from './internal/CarouselLayout.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  photos: PhotoItem[] | any[]
  photoAdapter?: PhotoAdapter
  adapter?: ImageAdapter

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
}>(), {
  showArrows: true,
  showThumbnails: true,
  showCounter: true,
  showDots: false,
  autoplay: false,
  lightbox: false,
})

const resolvedPhotos = computed<PhotoItem[]>(() =>
  props.photoAdapter ? (props.photos as any[]).map(props.photoAdapter) : (props.photos as PhotoItem[]),
)

const hasLightbox = computed(() => props.lightbox !== undefined && props.lightbox !== false)

const defaultMainOptions: EmblaOptionsType = { loop: false, align: 'start', containScroll: 'trimSnaps' }
const defaultThumbsOptions: EmblaOptionsType = { containScroll: 'keepSnaps', dragFree: true }

const mergedOptions = computed<EmblaOptionsType>(() => ({ ...defaultMainOptions, ...(props.options ?? {}) }))
const mergedThumbsOptions = computed<EmblaOptionsType>(() => ({ ...defaultThumbsOptions, ...(props.thumbsOptions ?? {}) }))

const mergedPlugins = computed<EmblaPluginType[]>(() => {
  const user = props.plugins ?? []
  const autoplay = props.autoplay
  if (!autoplay) return user.slice()

  const filtered = user.filter(p => p?.name !== 'autoplay')
  if (filtered.length !== user.length && (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV !== 'production') {
    console.warn('[nuxt-photo] PhotoCarousel: `autoplay` prop is set, so a user-supplied Autoplay plugin was dropped. Pass only one of them.')
  }

  const opts = typeof autoplay === 'object' ? autoplay : undefined
  return [Autoplay(opts), ...filtered]
})

type CarouselLayoutHandle = InstanceType<typeof CarouselLayout> & {
  emblaApi: EmblaCarouselType | null
  thumbsApi: EmblaCarouselType | null
  selectedIndex: number
  goTo: (index: number, instant?: boolean) => void
  goToNext: (instant?: boolean) => void
  goToPrev: (instant?: boolean) => void
  selectedSnap: () => number
  reInit: (options?: EmblaOptionsType, plugins?: EmblaPluginType[]) => void
}

const layoutRef = ref<CarouselLayoutHandle | null>(null)

const emblaApi = computed(() => layoutRef.value?.emblaApi ?? null)
const thumbsApi = computed(() => layoutRef.value?.thumbsApi ?? null)
const selectedIndex = computed(() => layoutRef.value?.selectedIndex ?? 0)

function goTo(index: number, instant = false) {
  layoutRef.value?.goTo(index, instant)
}

function goToNext(instant = false) {
  layoutRef.value?.goToNext(instant)
}

function goToPrev(instant = false) {
  layoutRef.value?.goToPrev(instant)
}

function selectedSnap() {
  return layoutRef.value?.selectedSnap() ?? 0
}

function reInit(options?: EmblaOptionsType, plugins?: EmblaPluginType[]) {
  layoutRef.value?.reInit(options, plugins)
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
