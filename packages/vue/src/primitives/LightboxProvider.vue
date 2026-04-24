<template>
  <div v-bind="$attrs">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
import type { LightboxTransitionOption } from '@nuxt-photo/engine'
import { useLightboxProvider } from '../composables/useLightboxProvider'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photos: PhotoItem | PhotoItem[]
  transition?: LightboxTransitionOption
  minZoom?: number
}>()

useLightboxProvider(
  computed(() => props.photos),
  {
    transition: props.transition,
    minZoom: props.minZoom,
  },
)
</script>
