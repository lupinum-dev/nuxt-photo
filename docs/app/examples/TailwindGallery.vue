<script setup lang="ts">
import { PhotoAlbum, type PhotoItem } from '@lupinum/nuxt-photo/app'
import TailwindLightbox from './TailwindLightbox.vue'

defineProps<{ photos: PhotoItem[] }>()
</script>

<template>
  <PhotoAlbum
    :photos="photos"
    :lightbox="TailwindLightbox"
    :layout="{ type: 'rows', targetRowHeight: 180 }"
    :spacing="6"
  />
</template>
