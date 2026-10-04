<script setup lang="ts">
import { labAlt } from '../../lab/photos'
import { labCount, repeatLabPhotos } from '../../lab/collection'
const route = useRoute()
const source = await usePhotoFolder('lab', { alt: labAlt })
const photos = ref(repeatLabPhotos(source.value, labCount(route.query.n, 1000)))
function append() {
  photos.value.push(
    ...repeatLabPhotos(
      source.value,
      Math.min(200, 5000 - photos.value.length),
      photos.value.length,
    ),
  )
}
</script>
<template>
  <LabFrame title="Large archive" :photos="photos"
    ><PhotoAlbum :photos="photos" @end-reached="append"
  /></LabFrame>
</template>
