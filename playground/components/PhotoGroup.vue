<template>
  <RecipePhotoGroup
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
import { computed, type Component } from 'vue'
import type { PhotoItem } from '@nuxt-photo/core'
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
</script>
