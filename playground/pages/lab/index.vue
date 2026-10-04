<script setup lang="ts">
import { labAlt } from '../../lab/photos'
const photos = await usePhotoFolder('lab', { alt: labAlt })
</script>
<template>
  <LabFrame title="Image Lab" :photos="photos">
    <p>
      Every image on these pages reports what it needed and what it got. Toggle the overlay to
      inspect each one.
    </p>
    <ul>
      <li><NuxtLink to="/lab/album">Album</NuxtLink></li>
      <li><NuxtLink to="/lab/carousel">Carousel</NuxtLink></li>
      <li><NuxtLink to="/lab/photo">Single photo</NuxtLink></li>
      <li><NuxtLink to="/lab/lightbox">Lightbox</NuxtLink></li>
      <li><NuxtLink to="/lab/archive">Large archive</NuxtLink></li>
    </ul>
  </LabFrame>
</template>
