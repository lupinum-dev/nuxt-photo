<script setup lang="ts">
import { demoPhotos } from '~/composables/demoPhotos'
import { responsive } from '@nuxt-photo/core'
</script>

<template>
  <PhotoAlbum
    :photos="demoPhotos"
    :layout="{
      type: 'masonry',
      columns: responsive({ 0: 2, 640: 3, 1024: 4 }),
    }"
    :spacing="6"
    :breakpoints="[375, 640, 1024, 1280]"
  />
</template>
