<script setup lang="ts">
import { Photo, PhotoAlbum, PhotoGroup, type PhotoItem } from '@lupinum/nuxt-photo/app'

const props = defineProps<{ photos: PhotoItem[] }>()

// One group owns the order, so the lightbox moves through every photo on the page.
const lead = props.photos[8]!
const details = [props.photos[9]!, props.photos[10]!, props.photos[5]!]
const all = [lead, ...details]
</script>

<template>
  <PhotoGroup :photos="all" navigation="fade">
    <article class="article">
      <h3>A slow week in the hills</h3>
      <Photo :photo="lead" class="article__lead" />
      <p>
        We walked the ridge every morning before the heat. The grass turned amber by evening, and
        the old stones in the meadow made a good place to rest.
      </p>
      <PhotoAlbum :photos="details" :layout="{ type: 'rows', targetRowHeight: 140 }" :spacing="8" />
      <p>Open any photo: the arrows move through the whole article, not only one block.</p>
    </article>
  </PhotoGroup>
</template>

<style scoped>
.article {
  max-width: 620px;
  margin: 0 auto;
  line-height: 1.65;
}

.article h3 {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.article p {
  margin: 16px 0;
  opacity: 0.8;
}

.article__lead :deep(img) {
  border-radius: 8px;
}
</style>
