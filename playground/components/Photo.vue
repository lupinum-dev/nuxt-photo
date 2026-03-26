<template>
  <RecipePhoto
    :photo="photo"
    :lightbox="resolvedLightbox"
    :lightbox-ignore="lightboxIgnore"
    :adapter="adapter"
    :loading="loading"
    v-bind="$attrs"
  >
    <template v-if="$slots.slide" #slide="slotProps">
      <slot name="slide" v-bind="slotProps" />
    </template>
  </RecipePhoto>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'
import { Photo as RecipePhoto } from '@nuxt-photo/recipes'
import Lightbox from './Lightbox.vue'

const props = defineProps<{
  photo: PhotoItem
  lightbox?: boolean | Component
  lightboxIgnore?: boolean
  adapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>()

const resolvedLightbox = computed(() => {
  if (props.lightbox === false || props.lightbox === undefined) return props.lightbox
  if (props.lightbox === true) return Lightbox
  return props.lightbox
})
</script>
