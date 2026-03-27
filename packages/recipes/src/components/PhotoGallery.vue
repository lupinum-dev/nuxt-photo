<!--
  @deprecated Use <PhotoGroup> + <PhotoAlbum :lightbox="false"> composition instead.
  PhotoGallery is a thin convenience wrapper that does not support all PhotoGroup features.
-->
<template>
  <PhotoGroup :photos="photos" :lightbox="lightbox" class="np-gallery">
    <PhotoAlbum
      :photos="photos"
      :layout="layout"
      :spacing="spacing"
      :padding="padding"
      :adapter="adapter"
      :lightbox="false"
    >
      <template v-if="$slots.thumbnail" #thumbnail="slotProps">
        <slot name="thumbnail" v-bind="slotProps" />
      </template>
    </PhotoAlbum>
  </PhotoGroup>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { PhotoItem, ImageAdapter, AlbumLayout } from '@nuxt-photo/core'
import PhotoAlbum from './PhotoAlbum.vue'
import PhotoGroup from './PhotoGroup.vue'

const props = withDefaults(defineProps<{
  photos: PhotoItem[]
  layout?: AlbumLayout | AlbumLayout['type']
  /** Gap between images in pixels @default 8 */
  spacing?: number
  /** Outer padding around each image in pixels @default 0 */
  padding?: number
  adapter?: ImageAdapter
  lightbox?: boolean | Component
}>(), {
  layout: 'rows',
  spacing: 8,
  padding: 0,
  lightbox: true,
})

</script>
