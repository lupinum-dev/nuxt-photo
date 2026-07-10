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
} from '../core/index'
import { useLightboxProvider } from '../composables/useLightboxProvider'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photos: PhotoItem | readonly PhotoItem[]
  transition?: LightboxTransitionOption
  minZoom?: number
  imageAdapter?: ImageAdapter
}>()

warnOnSetupOptionChanges('LightboxProvider', {
  transition: () => props.transition,
  minZoom: () => props.minZoom,
  imageAdapter: () => props.imageAdapter,
})

useLightboxProvider(
  computed(() => props.photos),
  {
    transition: props.transition,
    minZoom: props.minZoom,
    imageAdapter: props.imageAdapter,
  },
)
</script>
