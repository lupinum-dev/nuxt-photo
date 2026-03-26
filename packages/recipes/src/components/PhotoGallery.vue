<template>
  <PhotoGroup :photos="photos" :lightbox="false" class="np-gallery">
    <PhotoAlbum
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
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </PhotoAlbum>

    <Lightbox>
      <template v-if="$slots.slide" #slide="slideProps">
        <slot name="slide" v-bind="slideProps" />
      </template>
      <template v-if="$slots.caption" #caption="captionProps">
        <slot name="caption" v-bind="captionProps" />
      </template>
      <template v-if="$slots.actions" #actions="actionsProps">
        <slot name="actions" v-bind="actionsProps" />
      </template>
    </Lightbox>
  </PhotoGroup>
</template>

<script setup lang="ts">
import type { PhotoItem, ImageAdapter, BentoSizing } from '@nuxt-photo/core'
import PhotoAlbum from './PhotoAlbum.vue'
import Lightbox from './Lightbox.vue'
import PhotoGroup from './PhotoGroup.vue'

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: 'rows' | 'columns' | 'masonry' | 'bento'
  columns?: number
  /** Gap between images in pixels @default 8 */
  spacing?: number
  /** Outer padding around each image in pixels @default 0 */
  padding?: number
  /** Target row height in pixels (rows layout only) @default 300 */
  targetRowHeight?: number
  /** Row height in pixels (bento layout only) @default 280 */
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
