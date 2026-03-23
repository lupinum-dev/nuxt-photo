<script setup lang="ts">
const items = [
  {
    src: 'https://example.com/one.jpg',
    alt: 'One',
    width: 1200,
    height: 800,
    msrc: 'https://example.com/one-thumb.jpg',
    type: 'image',
  },
  {
    src: 'https://example.com/two.jpg',
    alt: 'Two',
    width: 1200,
    height: 900,
    msrc: 'https://example.com/two-thumb.jpg',
    type: 'image',
  },
]
</script>

<template>
  <PhotoLightbox :items="items" />
</template>
