<script setup lang="ts">
import type { PhotoItem } from '@nuxt-photo/nuxt'

const photos: PhotoItem[] = [
  {
    id: 'sunrise',
    src: '/photos/sunrise.jpg',
    width: 1280,
    height: 800,
    alt: 'Fixture sunrise',
  },
  {
    id: 'canyon',
    src: '/photos/canyon.jpg',
    width: 960,
    height: 1200,
    alt: 'Fixture canyon',
  },
]

const spacing = responsive({ 0: 4, 640: 8 })
const minZoom = useAppConfig().nuxtPhoto?.lightbox?.minZoom
</script>

<template>
  <main>
    <p id="nuxt-photo-min-zoom">{{ minZoom }}</p>
    <PhotoAlbum
      :photos="photos"
      layout="rows"
      :spacing="spacing"
      :target-row-height="220"
    />
  </main>
</template>
