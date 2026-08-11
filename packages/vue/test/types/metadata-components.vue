<script setup lang="ts">
import { Photo, PhotoAlbum, PhotoCarousel, PhotoGroup, type PhotoItem } from '../../src/index'

interface ConsumerMeta {
  photographer: string
}

const photos: readonly PhotoItem<ConsumerMeta>[] = [
  {
    id: 'one',
    src: '/one.jpg',
    width: 1200,
    height: 800,
    meta: { photographer: 'Ada' },
  },
]
</script>

<template>
  <Photo :photo="photos[0]!">
    <template #slide="{ photo }">{{ photo.meta?.photographer }}</template>
  </Photo>

  <PhotoAlbum :photos="photos">
    <template #thumbnail="{ photo }">{{ photo.meta?.photographer }}</template>
  </PhotoAlbum>

  <PhotoCarousel :photos="photos">
    <template #slide="{ photo }">{{ photo.meta?.photographer }}</template>
    <template #thumb="{ photo }">{{ photo.meta?.photographer }}</template>
    <template #caption="{ photo }">{{ photo.meta?.photographer }}</template>
  </PhotoCarousel>

  <PhotoGroup :photos="photos">
    <template #default="{ photos: groupedPhotos, controller }">
      {{ groupedPhotos[0]?.meta?.photographer }}
      {{ controller.activePhoto.value?.meta?.photographer }}
    </template>
  </PhotoGroup>
</template>
