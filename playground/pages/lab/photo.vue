<script setup lang="ts">
const photos = await useLabPhotos()
const photo = computed(() => photos.value.find((photo) => photo.id === 'lab/normal-04')!)
const secondPhoto = computed(() => photos.value.find((photo) => photo.id === 'lab/normal-05')!)
</script>
<template>
  <LabFrame title="Single photo" :photos="photos">
    <Photo :photo="photo" priority :lightbox="false" class="lab-photo" />
    <div style="width: 320px; max-width: 100%">
      <Photo :photo="secondPhoto" :lightbox="false" class="lab-photo" />
    </div>
  </LabFrame>
</template>
