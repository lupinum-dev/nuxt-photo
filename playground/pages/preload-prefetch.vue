<script setup lang="ts">
// Separate thumbnail and detail sources make speculative detail requests observable.
const photos = [
  { width: 800, height: 800 },
  { width: 1413, height: 1797 },
  { width: 2026, height: 2794 },
  { width: 2639, height: 3791 },
  { width: 3252, height: 1587 },
].map((dimensions, index) => ({
  ...dimensions,
  id: `prefetch-${index}`,
  src: `/lab/normal-0${index}.jpg`,
  thumbSrc: '/photos/moss-canyon.jpg',
  alt: `Prefetch photo ${index}`,
}))
const route = useRoute()
</script>

<template>
  <main style="max-width: 900px; margin: 32px auto">
    <PhotoAlbum :photos="photos" :priority="Number(route.query.priority) || 0" />
    <template v-if="route.query.duplicate">
      <Photo :photo="photos[0]!" priority :lightbox="false" />
      <Photo :photo="photos[0]!" priority :lightbox="false" />
    </template>
  </main>
</template>
