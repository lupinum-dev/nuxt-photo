<script setup lang="ts">
import { demoPhotos } from '~/composables/demoPhotos'
</script>

<template>
  <PhotoCarousel
    :photos="demoPhotos"
    :options="{ loop: true }"
    show-arrows
    show-thumbnails
    show-counter
    :lightbox="true"
    slide-aspect="16/9"
  />
</template>
