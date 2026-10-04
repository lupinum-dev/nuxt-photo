<template>
  <CarouselLayout
    ref="layoutRef"
    v-bind="{ ...$attrs, ...layoutProps }"
    :on-slide-activate="hasLightbox ? openSlide : undefined"
    :set-slide-ref="hasLightbox ? setItemRef : undefined"
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
import { computed, ref } from 'vue'
import type { PhotoCarouselAutoplayOptions, PhotoItem } from '../core/index'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
} from '../types/index'
import type { InvalidPhotoPolicy, InvalidPhotosEvent } from '../core/index'
import { useGalleryRuntime } from '../gallery/runtime'
import { useGalleryModel } from '../gallery/model'
import { useCollectionLightbox } from './shared/useCollectionLightbox'
import CarouselLayout from './photo-carousel/CarouselLayout.vue'
import { providePhotoConfig, type LightboxOptions, type PhotoProvider } from '../config'
import { useRecipePhotos } from './shared/useRecipePhotos'

import type { PhotoUi, CarouselControl } from '../types/ui'
import { useRecipeLightbox } from './shared/useRecipeLightbox'

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
    /** Photo ID to open or navigate; null closes. User navigation emits update:active. */
    active?: string | null
    ui?: PhotoUi<'PhotoCarousel'>
    /**
     * What to do with invalid photos: `'throw'` stops with an error, `'drop'` skips them and emits
     * `invalidPhotos`.
     * @default 'throw'
     */
    validation?: InvalidPhotoPolicy
    /** Image provider object, or a Nuxt Image provider name. Wins over inherited config. */
    provider?: PhotoProvider | string
    /**
     * Continue from the last slide to the first.
     * @default false
     */
    controls?: CarouselControl[]
    loop?: boolean
    /**
     * Let the track stop between slides after a drag.
     * @default false
     */
    dragFree?: boolean
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
     * `true` opens the built-in lightbox when a slide is selected; `lightbox.component` replaces it. Off by
     * default. Read once at mount; change the component `key` to remount.
     * @default false
     */
    lightbox?: boolean | LightboxOptions
  }>(),
  {
    lightbox: undefined,
    autoplay: false,
    controls: () => ['arrows', 'thumbnails', 'counter'],
  },
)

const emit = defineEmits<{
  'update:active': [id: string | null]
  invalidPhotos: [event: InvalidPhotosEvent]
}>()

const { options: recipeLightboxOptions } = useRecipeLightbox('PhotoCarousel', () => props.lightbox)

providePhotoConfig(() => ({
  provider: props.provider,
  lightbox: recipeLightboxOptions(),
  validation: props.validation,
}))

const resolvedPhotos = useRecipePhotos<TMeta>(
  () => props.photos,
  'PhotoCarousel',
  () => props.validation,
  (event) => emit('invalidPhotos', event),
)

const layoutRef = ref<{
  root: HTMLElement | null
  goTo(index: number): void
  goToNext(): void
  goToPrev(): void
} | null>(null)
const gallery = useGalleryRuntime(resolvedPhotos, () => layoutRef.value?.root ?? null)

const {
  hasLightbox,
  LightboxComponent: lightboxComponent,
  setItemRef,
  open,
  openById,
  close,
  isOpen,
  activeId: ownerActiveId,
  activePhoto: ownerActivePhoto,
} = useCollectionLightbox(
  resolvedPhotos,
  props,
  () => layoutRef.value?.root ?? null,
  'PhotoCarousel',
  false,
)
const openSlide = open
const { activeId, activePhoto } = useGalleryModel(
  'PhotoCarousel',
  () => props.active,
  () => resolvedPhotos.value,
  { isOpen, activeId: ownerActiveId, activePhoto: ownerActivePhoto, openById, close },
  (id) => emit('update:active', id),
)
function scrollTo(index: number) {
  layoutRef.value?.goTo(index)
}
function next() {
  layoutRef.value?.goToNext()
}
function prev() {
  layoutRef.value?.goToPrev()
}
defineExpose({ open, openById, close, isOpen, activeId, activePhoto, scrollTo, next, prev })

const layoutProps = computed(() => ({
  photos: resolvedPhotos.value,
  gallery,
  controls: props.controls,
  ui: props.ui,
  loop: props.loop,
  dragFree: props.dragFree,
  autoplay: props.autoplay,
  slideSize: props.slideSize,
  slideAspect: props.slideAspect,
  gap: props.gap,
  thumbSize: props.thumbSize,
}))
</script>
