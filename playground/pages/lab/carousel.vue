<script setup lang="ts">
const photos = await useLabPhotos()
const route = useRoute()
const slideSize = computed(() =>
  typeof route.query.slideSize === 'string' ? route.query.slideSize : '70%',
)
</script>
<template>
  <LabFrame title="Carousel" :photos="photos"
    ><PhotoCarousel :photos="photos" :slide-size="slideSize"
  /></LabFrame>
</template>
