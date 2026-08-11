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
import { computed, inject, onMounted, ref, watch, type Component } from 'vue'
import type {
  ImageAdapter,
  PhotoCarouselAutoplayOptions,
  PhotoCarouselOptions,
  PhotoItem,
} from '../core/index'
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
import { useLightboxProvider } from '../composables/index'
import { LightboxComponentKey } from '../provide/keys'
import CarouselLayout from './photo-carousel/CarouselLayout.vue'
import Lightbox from './Lightbox.vue'
import { resolveRecipePhotos } from '../core/photo/resolve'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'

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
    photos: readonly PhotoItem<TMeta>[]
    validation?: InvalidPhotoPolicy
    imageAdapter?: ImageAdapter<TMeta>
    options?: PhotoCarouselOptions
    showArrows?: boolean
    showThumbnails?: boolean
    showCounter?: boolean
    showDots?: boolean
    autoplay?: boolean | PhotoCarouselAutoplayOptions
    slideSize?: string
    slideAspect?: string
    gap?: string
    thumbSize?: string
    /** Setup-time lightbox capability. Remount to change it. */
    lightbox?: boolean | Component
    /** Setup-time transition configuration. Remount to change it. */
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

const emit = defineEmits<{
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const resolution = computed(() =>
  resolveRecipePhotos<TMeta>(props.photos, 'PhotoCarousel', {
    validation: props.validation,
  }),
)
const resolvedPhotos = computed(() => resolution.value.photos)
const reportingReady = ref(false)

onMounted(() => {
  reportingReady.value = true
})

watch(
  [() => resolution.value.invalidPhotos, reportingReady],
  ([event, ready]) => {
    if (ready && event) emit('invalidPhotos', event)
  },
  { flush: 'post' },
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
  transition: () => props.transition,
})
const provider = hasLightbox
  ? useLightboxProvider(resolvedPhotos, {
      transition: props.transition,
      imageAdapter: () => props.imageAdapter,
    })
  : null

async function openSlide(index: number) {
  await provider?.open(index)
}

const layoutProps = computed(() => ({
  photos: resolvedPhotos.value,
  imageAdapter: props.imageAdapter,
  options: props.options ?? {},
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
