<template>
  <div v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {
  ImageAdapter,
  LightboxTransitionOption,
  PhotoItem,
} from '@nuxt-photo/core'
import { useLightboxProvider } from '../composables/useLightboxProvider'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photos: PhotoItem | PhotoItem[]
  transition?: LightboxTransitionOption
  minZoom?: number
  imageAdapter?: ImageAdapter
}>()

useLightboxProvider(
  computed(() => props.photos),
  {
    transition: props.transition,
    minZoom: props.minZoom,
    imageAdapter: props.imageAdapter,
  },
)
</script>
