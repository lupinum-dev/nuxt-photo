<script setup lang="ts">
const photos = await usePhotoFolder('photos', { alt: { 'forest-tulips': 'Forest' } })
const route = useRoute()
const ready = ref(false)
onNuxtReady(() => {
  if (route.query.append === '1')
    photos.value.push({ ...photos.value[0]!, id: 'photos/client-appended' })
  ready.value = true
})
</script>
<template>
  <main :data-ready="ready">
    <PhotoAlbum :photos="photos" :lightbox="false" />
    <pre id="folder-data">{{
      JSON.stringify(
        photos.map((photo) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          preview: photo.placeholderSrc?.startsWith('data:image/webp'),
        })),
      )
    }}</pre>
  </main>
</template>
