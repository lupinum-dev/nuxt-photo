<template>
  <slot />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed } from 'vue'
import type { ImageAdapter, LightboxTransitionOption, PhotoItem } from '../core/index'
import { useLightboxProvider } from '../composables/useLightboxProvider'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photos: PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]
  transition?: LightboxTransitionOption
  minZoom?: number
  imageAdapter?: ImageAdapter<TMeta>
}>()

warnOnSetupOptionChanges('LightboxProvider', {
  transition: () => props.transition,
  minZoom: () => props.minZoom,
})

useLightboxProvider(
  computed(() => props.photos),
  {
    transition: props.transition,
    minZoom: props.minZoom,
    imageAdapter: computed(() => props.imageAdapter),
  },
)
</script>
