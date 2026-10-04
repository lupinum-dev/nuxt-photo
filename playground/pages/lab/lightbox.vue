<script setup lang="ts">
import { labAlt } from '../../lab/photos'
const photos = await usePhotoFolder('lab', { alt: labAlt })
const active = ref<string | null>(null)
</script>
<template>
  <LabFrame title="Lightbox" :photos="photos" :active="active" requests>
    <PhotoAlbum
      v-model:active="active"
      :photos="photos"
      :lightbox="{ tools: ['download', 'share', 'fullscreen'], deepLink: true }"
    />
  </LabFrame>
</template>
