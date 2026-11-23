<template>
  <div :data-np-slide="index" :data-np-active="isActive || undefined" v-bind="$attrs">
    <div data-np-slide-effect :class="effectClass">
      <div data-np-slide-frame :class="frameClass" :style="frameStyle">
        <div data-np-slide-zoom :class="zoomClass" :ref="ctx.setSlideZoomRef(index)">
          <slot
            v-if="$slots.default && showsContent"
            :photo="photo"
            :index="index"
            :width="frameWidth"
            :height="frameHeight"
          />
          <CustomSlideRenderer
            v-else-if="slideRenderer && showsContent"
            :renderer="slideRenderer"
            :photo="photo"
            :index="index"
          />
          <PhotoImage
            v-else-if="mediaMounted"
            :photo="photo"
            context="slide"
            :sizes="frameWidth > 0 ? `${frameWidth}px` : '100vw'"
            priority
            :fetchpriority="isActive ? 'high' : 'low'"
            data-np-slide-img
            @load="ctx.onSlideImageLoad(index)"
          />
        </div>
        <!-- The caption hangs under this photo inside its frame, outside the zoom: it moves and
             fades with its photo and has no motion of its own. Only the active one is read out. -->
        <div
          v-if="$slots.caption"
          ref="captionRef"
          data-np-motion="caption"
          data-np-slide-caption
          :class="captionClass"
          :aria-hidden="isActive ? undefined : 'true'"
        >
          <slot name="caption" :photo="photo" :index="index" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, inject, ref, watch, type PropType, type VNodeChild } from 'vue'
import { normalizePhotos, type ResolvedPhotoItem } from '../core/index'
import { LightboxSlideRendererKey } from '../provide/keys'
import type { LightboxSlideRenderer } from '../provide/keys'
import type { LightboxSlideSlotProps } from '../types/slots'
import { useLightboxInject } from '../lightbox/inject'
import PhotoImage from './PhotoImage.vue'

defineSlots<{
  default?: (props: LightboxSlideSlotProps) => unknown
  /** This photo's caption, rendered under its frame. */
  caption?: (props: { photo: ResolvedPhotoItem; index: number }) => unknown
}>()

const props = defineProps<{
  /** The photo of this slide. */
  photo: ResolvedPhotoItem
  /** Position of `photo` in the provider's collection. */
  index: number
  /** Classes for the wrapper that runs the fade and slide effects. */
  effectClass?: string
  /** Classes for the element sized to the photo frame. */
  frameClass?: string
  /** Classes for the zoom and pan wrapper. */
  zoomClass?: string
  /** Classes for the caption under the frame. */
  captionClass?: string
}>()

const ctx = useLightboxInject('LightboxSlide')
const resolveSlide = inject(LightboxSlideRendererKey, () => null)

const slideRenderer = computed(() => resolveSlide(props.photo))
const isActive = computed(() => ctx.activeIndex.value === props.index)
// Custom content renders on the active slide, and on a slide still fading out of view.
const showsContent = computed(() => isActive.value || ctx.isSlideLeaving(props.index))
const mediaMounted = computed(() => ctx.isSlideMediaMounted(props.index))

// A caption that mounts while the lightbox is open takes the controls' visibility.
const captionRef = ref<HTMLElement | null>(null)
watch(captionRef, (element) => element && ctx.adoptCaption(element), { flush: 'post' })

const frameStyle = computed(() =>
  ctx.getSlideFrameStyle(
    normalizePhotos([props.photo], {
      owner: 'LightboxSlide',
      resolveDimensions: ctx.photoConfig.value.dimensions,
    }).photos[0]!,
  ),
)

// Extract pixel dimensions from frame style for slot props
const frameWidth = computed(() => Number.parseInt(frameStyle.value.width as string) || 0)
const frameHeight = computed(() => Number.parseInt(frameStyle.value.height as string) || 0)

// Stable wrapper component defined ONCE — never recreated on each render
const CustomSlideRenderer = defineComponent({
  name: 'NuxtPhotoCustomSlide',
  props: {
    renderer: {
      type: Function as PropType<LightboxSlideRenderer>,
      required: true,
    },
    photo: { type: Object as PropType<ResolvedPhotoItem>, required: true },
    index: { type: Number, required: true },
  },
  setup(p) {
    return () => p.renderer({ photo: p.photo, index: p.index }) as VNodeChild
  },
})
</script>
