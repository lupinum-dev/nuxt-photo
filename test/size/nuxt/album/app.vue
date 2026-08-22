<script setup lang="ts">
const photos = [
  {
    id: 'fixture-one',
    src: '/one.jpg',
    width: 1200,
    height: 800,
    alt: 'First fixture photo',
  },
  {
    id: 'fixture-two',
    src: '/two.jpg',
    width: 800,
    height: 1200,
    alt: 'Second fixture photo',
  },
]
</script>

<template>
  <PhotoAlbum :photos="photos" />
</template>
