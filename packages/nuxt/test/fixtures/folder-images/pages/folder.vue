<script setup lang="ts">
const photos = await usePhotoFolder('nested', {
  sort: 'name-desc',
  alt: { photo: 'Nested image' },
  caption: { photo: 'Caption' },
})
</script>
<template>
  <PhotoAlbum :photos="photos" :lightbox="false" />
  <pre id="folder-data">{{ JSON.stringify(photos) }}</pre>
</template>
