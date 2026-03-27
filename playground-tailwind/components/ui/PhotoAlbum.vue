<template>
  <RecipePhotoAlbum
    :photos="photos"
    :layout="layout"
    :columns="columns"
    :spacing="spacing"
    :padding="padding"
    :target-row-height="targetRowHeight"
    :bento-row-height="bentoRowHeight"
    :bento-sizing="bentoSizing"
    :bento-pattern-interval="bentoPatternInterval"
    :adapter="adapter"
    v-bind="$attrs"
  >
    <template v-if="$slots.thumbnail" #thumbnail="slotProps">
      <slot name="thumbnail" v-bind="slotProps" />
    </template>
  </RecipePhotoAlbum>
</template>

<script setup lang="ts">
import type { BentoSizing, ImageAdapter, PhotoItem } from '@nuxt-photo/core'

defineOptions({ inheritAttrs: false })
import { PhotoAlbum as RecipePhotoAlbum } from '@nuxt-photo/recipes'

withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  columns?: number
  spacing?: number
  padding?: number
  targetRowHeight?: number
  bentoRowHeight?: number
  bentoSizing?: BentoSizing
  bentoPatternInterval?: number
  adapter?: ImageAdapter
}>(), {
  layout: 'rows',
  columns: 3,
  spacing: 8,
  padding: 0,
  targetRowHeight: 300,
  bentoRowHeight: 280,
  bentoSizing: 'auto',
  bentoPatternInterval: 5,
})
</script>
