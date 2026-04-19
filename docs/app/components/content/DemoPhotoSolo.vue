<script setup lang="ts">
import { demoPhotos } from '~/composables/demoPhotos'

const hero = demoPhotos[0]
</script>

<template>
  <div class="max-w-md mx-auto">
    <Photo :photo="hero" lightbox />
  </div>
</template>
