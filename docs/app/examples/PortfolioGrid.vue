<script setup lang="ts">
import { PhotoAlbum, PhotoImage, responsive, type PhotoItem } from '@lupinum/nuxt-photo/app'

defineProps<{ photos: PhotoItem[] }>()
</script>

<template>
  <PhotoAlbum
    :photos="photos"
    :layout="{ type: 'columns', columns: responsive({ 0: 2, 480: 3 }) }"
    :spacing="responsive({ 0: 12, 640: 20 })"
    :lightbox="{ navigation: 'crossfade' }"
  >
    <template #thumbnail="{ photo, hidden, sizes, priority }">
      <figure class="work" :class="{ 'work--hidden': hidden }">
        <PhotoImage
          :photo="photo"
          context="thumb"
          :sizes="sizes"
          :priority="priority"
          class="work__image"
        />
        <figcaption class="work__caption">{{ photo.caption }}</figcaption>
      </figure>
    </template>
  </PhotoAlbum>
</template>

<style scoped>
.work {
  position: relative;
  margin: 0;
}

.work__image {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 6px;
  transition: opacity 200ms ease;
}

.work:hover .work__image {
  opacity: 0.88;
}

/* The album sizes each tile from the photo alone, so the caption sits on the photo. */
.work__caption {
  position: absolute;
  inset: auto 0 0;
  padding: 28px 12px 10px;
  border-radius: 0 0 6px 6px;
  background: linear-gradient(transparent, rgb(0 0 0 / 0.6));
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

/* The lightbox animates this photo; hide the caption so it does not sit alone. */
.work--hidden .work__caption {
  visibility: hidden;
}
</style>
