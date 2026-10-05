<script setup lang="ts">
const photos = await useLabPhotos()
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
