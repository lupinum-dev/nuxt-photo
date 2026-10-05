<template>
  <div data-np-slide :data-np-active="isActive || undefined" v-bind="$attrs">
    <div data-np-slide-effect :class="effectClass">
      <div
        data-np-slide-frame
        :class="frameClass"
        :style="frameStyle"
        :ref="ctx.setSlideFrameRef(index)"
      >
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
            :ref="ctx.setSlideImageRef(index)"
            :photo="photo"
            context="slide"
            :sizes="frameWidth > 0 ? `${frameWidth}px` : '100vw'"
            priority
            :fetchpriority="isActive ? 'high' : 'low'"
            data-np-slide-img
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, inject, type PropType, type VNodeChild } from 'vue'
import { normalizePhotos, type PhotoItem } from '../core/index'
import { LightboxSlideRendererKey } from '../provide/keys'
import type { LightboxSlideRenderer } from '../provide/keys'
import type { LightboxSlideSlotProps } from '../types/slots'
import { useLightboxInject } from '../lightbox/inject'
import PhotoImage from './PhotoImage.vue'

defineSlots<{ default?: (props: LightboxSlideSlotProps) => unknown }>()

const props = defineProps<{
  /** The photo of this slide. */
  photo: PhotoItem
  /** Position of `photo` in the provider's collection. */
  index: number
  /** Classes for the wrapper that runs the fade and slide effects. */
  effectClass?: string
  /** Classes for the element sized to the photo frame. */
  frameClass?: string
  /** Classes for the zoom and pan wrapper. */
  zoomClass?: string
}>()

const ctx = useLightboxInject('LightboxSlide')
const resolveSlide = inject(LightboxSlideRendererKey, () => null)

const slideRenderer = computed(() => resolveSlide(props.photo))
const isActive = computed(() => ctx.activeIndex.value === props.index)
// Custom content renders on the active slide, and on a slide still fading out of view.
const showsContent = computed(() => isActive.value || ctx.isSlideLeaving(props.index))
const mediaMounted = computed(() => ctx.isSlideMediaMounted(props.index))

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
    photo: { type: Object as PropType<PhotoItem>, required: true },
    index: { type: Number, required: true },
  },
  setup(p) {
    return () => p.renderer({ photo: p.photo, index: p.index }) as VNodeChild
  },
})
</script>
