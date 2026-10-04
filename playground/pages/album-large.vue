<script setup lang="ts">
import { ref } from 'vue'
import { demoPhotos } from 'nuxt-photo-demo'
const route = useRoute()
const count = Number(route.query.count ?? 1000)
const visible = ref(false)
const ready = ref(false)
const ends = ref(0)
const photos = Array.from({ length: count }, (_, index) => ({
  ...demoPhotos[index % demoPhotos.length]!,
  id: `archive-${index}`,
  alt: `Archive photo ${index}`,
}))
onNuxtReady(() => {
  ready.value = true
})
</script>
<template>
  <main class="archive-proof" :data-ready="ready">
    <button id="mount-album" @click="visible = true">Mount album</button>
    <NuxtLink id="folder-link" to="/folder-images">Folder images</NuxtLink>
    <output id="end-count">{{ ends }}</output>
    <PhotoAlbum
      v-if="visible"
      :photos="photos"
      :default-container-width="1200"
      @end-reached="ends++"
    />
  </main>
</template>
<style scoped>
.archive-proof {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
