<template>
  <RecipePhotoAlbum
    :photos="photos"
    :layout="layout"
    :spacing="spacing"
    :padding="padding"
    :adapter="adapter"
    v-bind="$attrs"
  >
    <template v-if="$slots.thumbnail" #thumbnail="slotProps">
      <slot name="thumbnail" v-bind="slotProps" />
    </template>
  </RecipePhotoAlbum>
</template>

<script setup lang="ts">
import type { AlbumLayout, ImageAdapter, PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { PhotoAlbum as RecipePhotoAlbum } from '@nuxt-photo/recipes'

withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: AlbumLayout | AlbumLayout['type']
  spacing?: number
  padding?: number
  adapter?: ImageAdapter
}>(), {
  layout: 'rows',
  spacing: 8,
  padding: 0,
})
</script>
