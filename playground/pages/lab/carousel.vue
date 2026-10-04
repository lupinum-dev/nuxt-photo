<script setup lang="ts">
import { labAlt } from '../../lab/photos'
const photos = await usePhotoFolder('lab', { alt: labAlt })
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
