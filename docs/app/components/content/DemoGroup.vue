<script setup lang="ts">
import { demoPhotos } from '~/composables/demoPhotos'
import { computed } from 'vue'

const landscape = computed(() => demoPhotos.slice(0, 6))
const portrait = computed(() => demoPhotos.slice(6, 12))
</script>

<template>
  <PhotoGroup>
    <div class="space-y-6">
      <div>
        <p class="text-sm text-muted mb-2 font-medium">Landscapes</p>
        <PhotoAlbum
          :photos="landscape"
          layout="rows"
          :target-row-height="200"
          :spacing="6"
          :breakpoints="[375, 600, 900, 1200]"
        />
      </div>
      <div>
        <p class="text-sm text-muted mb-2 font-medium">Studies</p>
        <PhotoAlbum
          :photos="portrait"
          layout="rows"
          :target-row-height="160"
          :spacing="6"
          :breakpoints="[375, 600, 900, 1200]"
        />
      </div>
    </div>
  </PhotoGroup>
</template>
