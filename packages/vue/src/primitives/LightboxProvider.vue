<template>
  <slot />
</template>

<script setup lang="ts" generic="TMeta extends object = Readonly<Record<string, unknown>>">
import { computed } from 'vue'
import type {
  ImageAdapter,
  LightboxNavigationMode,
  LightboxTransitionOption,
  PhotoItem,
} from '../core/index'
import { provideLightbox } from '../composables/provideLightbox'
import { warnOnSetupOptionChanges } from '../internal/staticOptionWarnings'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  photos: PhotoItem<TMeta> | readonly PhotoItem<TMeta>[]
  transition?: LightboxTransitionOption
  navigation?: LightboxNavigationMode
  minZoom?: number
  imageAdapter?: ImageAdapter<TMeta>
}>()

warnOnSetupOptionChanges('LightboxProvider', {
  minZoom: () => props.minZoom,
})

provideLightbox(
  computed(() => props.photos),
  {
    transition: () => props.transition,
    navigation: () => props.navigation,
    minZoom: props.minZoom,
    imageAdapter: computed(() => props.imageAdapter),
  },
)
</script>
