<template>
  <RecipePhotoAlbum
    :photos="photos"
    :layout="layout"
    :target-row-height="targetRowHeight"
    :columns="columns"
    :spacing="spacing"
    :padding="padding"
    :image-adapter="imageAdapter"
    v-bind="$attrs"
  >
    <template v-if="$slots.thumbnail" #thumbnail="slotProps">
      <slot name="thumbnail" v-bind="slotProps" />
    </template>
  </RecipePhotoAlbum>
</template>

<script setup lang="ts">
import type { AlbumLayout, ImageAdapter, PhotoItem, ResponsiveParameter } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { PhotoAlbum as RecipePhotoAlbum } from '@nuxt-photo/recipes'

withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: AlbumLayout | AlbumLayout['type']
  targetRowHeight?: ResponsiveParameter<number>
  columns?: ResponsiveParameter<number>
  spacing?: number
  padding?: number
  imageAdapter?: ImageAdapter
}>(), {
  layout: 'rows',
  spacing: 8,
  padding: 0,
})
</script>
