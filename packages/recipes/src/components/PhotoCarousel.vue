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
import {
  computed,
  defineComponent,
  h,
  type Component,
  type ComponentPublicInstance,
  type PropType,
} from 'vue'
import Autoplay, { type AutoplayOptionsType } from 'embla-carousel-autoplay'
import type { EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import type { PhotoMapper, ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import type {
  CarouselCaptionSlotProps,
  CarouselControlsSlotProps,
  CarouselDotsSlotProps,
  CarouselSlideSlotProps,
  CarouselThumbSlotProps,
  LightboxTransitionOption,
} from '@nuxt-photo/vue'
import PhotoGroup from './PhotoGroup.vue'
import CarouselLayout from './internal/CarouselLayout.vue'
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
    photos: PhotoItem[] | any[]
    itemMapper?: PhotoMapper
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
  resolveRecipePhotos(props.photos, props.itemMapper, 'PhotoCarousel'),
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

const CarouselLayoutHost = defineComponent({
  name: 'CarouselLayoutHost',
  inheritAttrs: false,
  props: {
    photos: { type: Array as PropType<PhotoItem[]>, required: true },
    imageAdapter: {
      type: Function as PropType<ImageAdapter>,
      default: undefined,
    },
    options: { type: Object as PropType<EmblaOptionsType>, required: true },
    plugins: { type: Array as PropType<EmblaPluginType[]>, required: true },
    thumbsOptions: {
      type: Object as PropType<EmblaOptionsType>,
      required: true,
    },
    showArrows: { type: Boolean, required: true },
    showThumbnails: { type: Boolean, required: true },
    showCounter: { type: Boolean, required: true },
    showDots: { type: Boolean, required: true },
    slideSize: { type: String, default: undefined },
    slideAspect: { type: String, default: undefined },
    gap: { type: String, default: undefined },
    thumbSize: { type: String, default: undefined },
    lightbox: {
      type: [Boolean, Object, Function] as PropType<boolean | Component>,
      default: false,
    },
    transition: {
      type: [String, Object] as PropType<LightboxTransitionOption>,
      default: undefined,
    },
    slideClass: { type: String, default: undefined },
    imgClass: { type: String, default: undefined },
    thumbClass: { type: String, default: undefined },
    captionClass: { type: String, default: undefined },
    controlsClass: { type: String, default: undefined },
  },
  setup(hostProps, { attrs, slots }) {
    const renderLayout = (
      open?: (index: number) => void,
      setThumbRef?: (
        index: number,
      ) => (el: Element | ComponentPublicInstance | null) => void,
    ) =>
      h(
        CarouselLayout,
        {
          ...attrs,
          photos: hostProps.photos,
          imageAdapter: hostProps.imageAdapter,
          options: hostProps.options,
          plugins: hostProps.plugins,
          thumbsOptions: hostProps.thumbsOptions,
          showArrows: hostProps.showArrows,
          showThumbnails: hostProps.showThumbnails,
          showCounter: hostProps.showCounter,
          showDots: hostProps.showDots,
          slideSize: hostProps.slideSize,
          slideAspect: hostProps.slideAspect,
          gap: hostProps.gap,
          thumbSize: hostProps.thumbSize,
          slideClass: hostProps.slideClass,
          imgClass: hostProps.imgClass,
          thumbClass: hostProps.thumbClass,
          captionClass: hostProps.captionClass,
          controlsClass: hostProps.controlsClass,
          onSlideActivate: open,
          setSlideRef: setThumbRef,
        },
        slots,
      )

    return () => {
      if (hostProps.lightbox === false) return renderLayout()

      return h(
        PhotoGroup,
        {
          photos: hostProps.photos,
          imageAdapter: hostProps.imageAdapter,
          lightbox: hostProps.lightbox,
          transition: hostProps.transition,
        },
        {
          default: ({
            open,
            setThumbRef,
          }: {
            open: (index: number) => void
            setThumbRef: (
              index: number,
            ) => (el: Element | ComponentPublicInstance | null) => void
          }) => renderLayout(open, setThumbRef),
        },
      )
    }
  },
})
</script>
