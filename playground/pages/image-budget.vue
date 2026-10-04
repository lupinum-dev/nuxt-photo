<template>
  <main style="padding: 16px">
    <PhotoCarousel v-if="kind === 'carousel'" :photos="photos" slide-size="70%" :lightbox="false" />
    <Photo
      v-else-if="kind === 'photo'"
      :photo="photos[0]!"
      :lightbox="false"
      style="max-width: 320px"
    />
    <PhotoAlbum
      v-else
      :photos="photos"
      :layout="layout"
      :priority="priority"
      :lightbox="kind === 'lightbox'"
    />
  </main>
</template>

<script setup lang="ts">
import type { AlbumLayout } from '@lupinum/nuxt-photo/app'
import { demoPhotos as photos } from 'nuxt-photo-demo'

const route = useRoute()
const kind = computed(() => route.query.kind)
const layout = computed<AlbumLayout>(() => {
  const type = route.query.layout
  return type === 'columns' || type === 'masonry'
    ? { type, columns: Number(route.query.columns) || 3 }
    : { type: 'rows' }
})
const priority = computed(() => Number(route.query.priority) || 0)
</script>
