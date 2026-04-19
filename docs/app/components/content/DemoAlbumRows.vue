<script setup lang="ts">
import { demoPhotos } from '~/composables/demoPhotos'
</script>

<template>
  <PhotoAlbum
    :photos="demoPhotos"
    layout="rows"
    :target-row-height="240"
    :spacing="6"
    :breakpoints="[375, 600, 900, 1200]"
  />
</template>
