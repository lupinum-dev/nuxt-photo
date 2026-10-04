<script setup lang="ts">
import { labAlt } from '../../lab/photos'
const photos = await usePhotoFolder('lab', { alt: labAlt })
const photo = computed(() => photos.value.find((photo) => photo.id === 'lab/normal-04')!)
</script>
<template>
  <LabFrame title="Single photo" :photos="photos">
    <Photo :photo="photo" priority :lightbox="false" class="lab-photo" />
    <div style="width: 320px; max-width: 100%">
      <Photo :photo="photo" :lightbox="false" class="lab-photo" />
    </div>
  </LabFrame>
</template>
