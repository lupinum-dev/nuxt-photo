<script setup lang="ts">
const photos = [
  { id: 'jpg', src: '/gallery/photo.jpg?cache=1#photo' },
  { id: 'png', src: '/nested/photo.png' },
  { id: 'svg', src: '/photo.svg' },
  { id: 'space', src: '/gallery/with%20space.png' },
  { id: 'oriented', src: '/oriented.jpg' },
]
</script>

<template>
  <PhotoAlbum :photos="photos" :lightbox="false" />
</template>
