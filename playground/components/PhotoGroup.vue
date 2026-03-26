<template>
  <RecipePhotoGroup
    ref="innerGroup"
    :photos="photos"
    :lightbox="resolvedLightbox"
    v-bind="$attrs"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </RecipePhotoGroup>
</template>

<script setup lang="ts">
import { ref, computed, type Component } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { PhotoGroup as RecipePhotoGroup } from '@nuxt-photo/recipes'
import Lightbox from './Lightbox.vue'

const props = withDefaults(defineProps<{
  photos?: PhotoItem[]
  lightbox?: boolean | Component
}>(), {
  lightbox: true,
})

const resolvedLightbox = computed(() => {
  if (props.lightbox === false) return false
  if (props.lightbox === true) return Lightbox
  return props.lightbox
})

const innerGroup = ref<{ open: (photoOrIndex: PhotoItem | number) => void; close: () => void } | null>(null)

defineExpose({
  open: (photoOrIndex: PhotoItem | number) => innerGroup.value?.open(photoOrIndex),
  close: () => innerGroup.value?.close(),
})
</script>
