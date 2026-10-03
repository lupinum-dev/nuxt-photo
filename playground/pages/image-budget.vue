<template>
  <main style="padding: 16px">
    <PhotoAlbum :photos="photos" :layout="layout" :priority="priority" :lightbox="false" />
  </main>
</template>

<script setup lang="ts">
import type { AlbumLayout } from '@lupinum/nuxt-photo/app'
import { demoPhotos as photos } from 'nuxt-photo-demo'

const route = useRoute()
const layout = computed<AlbumLayout>(() => {
  const type = route.query.layout
  return type === 'columns' || type === 'masonry'
    ? { type, columns: Number(route.query.columns) || 3 }
    : { type: 'rows' }
})
const priority = computed(() => Number(route.query.priority) || 0)
</script>
