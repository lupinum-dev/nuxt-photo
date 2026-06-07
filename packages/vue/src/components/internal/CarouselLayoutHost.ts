import {
  defineComponent,
  h,
  type Component,
  type ComponentPublicInstance,
  type PropType,
} from 'vue'
import type { EmblaOptionsType, EmblaPluginType } from 'embla-carousel'
import type {
  ImageAdapter,
  LightboxTransitionOption,
  PhotoItem,
} from '../../core/index'
import PhotoGroup from '../PhotoGroup.vue'
import CarouselLayout from './CarouselLayout.vue'

export default defineComponent({
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
  setup(props, { attrs, slots }) {
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
          photos: props.photos,
          imageAdapter: props.imageAdapter,
          options: props.options,
          plugins: props.plugins,
          thumbsOptions: props.thumbsOptions,
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
          onSlideActivate: open,
          setSlideRef: setThumbRef,
        },
        slots,
      )

    return () => {
      if (props.lightbox === false) return renderLayout()

      return h(
        PhotoGroup,
        {
          photos: props.photos,
          imageAdapter: props.imageAdapter,
          lightbox: props.lightbox,
          transition: props.transition,
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
