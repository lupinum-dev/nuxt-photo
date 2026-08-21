<template>
  <CarouselLayout
    ref="carouselRef"
    v-bind="{ ...$attrs, ...layoutProps }"
    :on-slide-activate="lightboxEnabled ? openSlide : undefined"
    :set-slide-ref="provider.setThumbnailRef"
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
  LightboxTransitionOption,
} from '../core/index'
import { provideLightbox } from '../composables/index'
import { LightboxComponentKey } from '../provide/keys'
import CarouselLayout from './photo-carousel/CarouselLayout.vue'
import Lightbox from './Lightbox.vue'
import { resolveRecipePhotos } from '../core/photo/resolve'
import { resolveLightboxComponent } from './shared/resolveLightboxComponent'
import type { CarouselBehaviorOptions } from './photo-carousel/usePhotoCarouselRuntime'

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
    loop?: boolean
    dragFree?: boolean
    slidesToScroll?: number
    showArrows?: boolean
    showThumbnails?: boolean
    showCounter?: boolean
    showDots?: boolean
    autoplay?: boolean | PhotoCarouselAutoplayOptions
    slideSize?: string
    slideAspect?: string
    gap?: string
    thumbSize?: string
    /** Reactive lightbox capability. */
    lightbox?: boolean | Component
    /** Reactive transition configuration. */
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
    lightbox: true,
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
const lightboxComponent = computed(() =>
  resolveLightboxComponent(props.lightbox, injectedLightbox, Lightbox, true),
)
const lightboxEnabled = computed(() => lightboxComponent.value !== null)
const provider = provideLightbox(resolvedPhotos, {
  transition: () => props.transition,
  imageAdapter: computed(() => props.imageAdapter),
})

watch(lightboxEnabled, (enabled) => {
  if (!enabled && provider.isOpen.value) void provider.close()
})

async function openSlide(index: number) {
  if (!lightboxEnabled.value) return
  await provider.open(index)
}

const carouselOptions = computed<CarouselBehaviorOptions>(() => ({
  loop: props.loop,
  dragFree: props.dragFree,
  slidesToScroll: props.slidesToScroll,
}))

const layoutProps = computed(() => ({
  photos: resolvedPhotos.value,
  imageAdapter: props.imageAdapter,
  options: carouselOptions.value,
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

type CarouselLayoutController = {
  selectedIndex: number
  goTo(index: number, instant?: boolean): void
  goToNext(instant?: boolean): void
  goToPrev(instant?: boolean): void
}

const carouselRef = ref<CarouselLayoutController | null>(null)
const selectedIndex = computed(() => carouselRef.value?.selectedIndex ?? 0)

function goToSlide(index: number, instant = false) {
  carouselRef.value?.goTo(index, instant)
}

function goToNextSlide(instant = false) {
  carouselRef.value?.goToNext(instant)
}

function goToPreviousSlide(instant = false) {
  carouselRef.value?.goToPrev(instant)
}

async function open(index = 0) {
  if (!lightboxEnabled.value) return
  await provider.open(index)
}

async function openById(id: string) {
  if (!lightboxEnabled.value) return
  await provider.openById(id)
}

async function close() {
  await provider.close()
}

const isOpen = computed(() => lightboxEnabled.value && provider.isOpen.value)

defineExpose({
  open,
  openById,
  close,
  isOpen,
  goToSlide,
  goToNextSlide,
  goToPreviousSlide,
  selectedIndex,
})
</script>
