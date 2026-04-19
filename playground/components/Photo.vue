<template>
  <RecipePhoto
    :photo="photo"
    :lightbox-ignore="lightboxIgnore"
    :image-adapter="imageAdapter"
    :loading="loading"
    v-bind="$attrs"
  >
    <template v-if="$slots.slide" #slide="slotProps">
      <slot name="slide" v-bind="slotProps" />
    </template>
  </RecipePhoto>
</template>

<script setup lang="ts">
import type { ImageAdapter, PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { Photo as RecipePhoto } from '@nuxt-photo/recipes'

defineProps<{
  photo: PhotoItem
  lightboxIgnore?: boolean
  imageAdapter?: ImageAdapter
  loading?: 'lazy' | 'eager'
}>()
</script>
