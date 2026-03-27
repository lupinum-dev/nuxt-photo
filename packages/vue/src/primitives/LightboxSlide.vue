<template>
  <div v-bind="$attrs">
    <div data-np-slide-effect :class="effectClass" :style="ctx.getSlideEffectStyle(index)">
      <div data-np-slide-frame :class="frameClass" :style="frameStyle">
        <div data-np-slide-zoom :class="zoomClass" :ref="ctx.setSlideZoomRef(index)">
          <slot v-if="$slots.default" :photo="photo" :index="index" :width="frameWidth" :height="frameHeight" />
          <CustomSlideRenderer v-else-if="slideRenderer" :renderer="slideRenderer" :photo="photo" :index="index" />
          <PhotoImage
            v-else
            :photo="photo"
            context="slide"
            :loading="isActive ? 'eager' : 'lazy'"
            data-np-slide-img
            :class="imgClass"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, inject, type FunctionalComponent } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { LightboxSlideRendererKey } from '../provide/keys'
import type { LightboxSlideRenderer } from '../provide/keys'
import { useLightboxInject } from '../composables/useLightboxInject'
import PhotoImage from './PhotoImage.vue'

const props = defineProps<{
  photo: PhotoItem
  index: number
  effectClass?: string
  frameClass?: string
  zoomClass?: string
  imgClass?: string
}>()

const ctx = useLightboxInject('LightboxSlide')
const resolveSlide = inject(LightboxSlideRendererKey, () => null)

const slideRenderer = computed(() => resolveSlide(props.photo))
const isActive = computed(() => ctx.activeIndex.value === props.index)

const frameStyle = computed(() => ctx.getSlideFrameStyle(props.photo))

// Extract pixel dimensions from frame style for slot props
const frameWidth = computed(() => Number.parseInt(frameStyle.value.width as string) || 0)
const frameHeight = computed(() => Number.parseInt(frameStyle.value.height as string) || 0)

// Stable wrapper component defined ONCE — never recreated on each render
const CustomSlideRenderer = defineComponent({
  name: 'NuxtPhotoCustomSlide',
  props: {
    renderer: { type: Function as unknown as () => LightboxSlideRenderer, required: true },
    photo: { type: Object as unknown as () => PhotoItem, required: true },
    index: { type: Number, required: true },
  },
  setup(p) {
    return () => (p.renderer as LightboxSlideRenderer)({ photo: p.photo, index: p.index }) as any
  },
})
</script>
