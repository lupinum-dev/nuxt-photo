<script setup lang="ts">
import { PhotoAlbum, type PhotoItem } from '@lupinum/nuxt-photo/app'
import CaptionLightbox from './CaptionLightbox.vue'

defineProps<{ photos: PhotoItem[] }>()
</script>

<template>
  <PhotoAlbum
    :photos="photos.slice(0, 6)"
    :lightbox="CaptionLightbox"
    :layout="{ type: 'rows', targetRowHeight: 150 }"
    :spacing="6"
  />
</template>
