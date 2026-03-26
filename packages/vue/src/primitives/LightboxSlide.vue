<template>
  <div v-bind="$attrs">
    <div :style="ctx.getSlideEffectStyle(index)">
      <div :style="ctx.getSlideFrameStyle(photo)">
        <div :ref="ctx.setSlideZoomRef(index)">
          <slot v-if="$slots.default" :photo="photo" :index="index" />
          <component :is="customSlide" v-else-if="customSlide" />
          <PhotoImage v-else :photo="photo" context="slide" loading="lazy" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, inject } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import { LightboxSlideRendererKey, LightboxSlidesKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'
import PhotoImage from './PhotoImage.vue'

const props = defineProps<{
  photo: PhotoItem
  index: number
}>()

const ctx = requireInjection(LightboxSlidesKey, 'LightboxSlide', 'an active lightbox slides context')
const resolveSlide = inject(LightboxSlideRendererKey, () => null)

const customSlide = computed(() => {
  const renderer = resolveSlide(props.photo)
  if (!renderer) return null

  return defineComponent({
    name: 'NuxtPhotoCustomSlide',
    setup: () => () => renderer({ photo: props.photo, index: props.index }) as any,
  })
})
</script>
