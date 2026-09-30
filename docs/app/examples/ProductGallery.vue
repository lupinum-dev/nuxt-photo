<script setup lang="ts">
import { PhotoCarousel, type PhotoItem } from '@lupinum/nuxt-photo/app'

defineProps<{ photos: PhotoItem[] }>()
</script>

<template>
  <div class="product">
    <PhotoCarousel
      :photos="photos"
      :show-counter="false"
      :lightbox="true"
      class="product__gallery"
    />
    <div class="product__details">
      <p class="product__eyebrow">Print, 50 × 70 cm</p>
      <h3>Moss Canyon</h3>
      <p>
        Archival pigment print on matte cotton paper. Swipe through the photos, or select one to see
        it large.
      </p>
    </div>
  </div>
</template>

<style scoped>
.product {
  display: grid;
  gap: 24px;
  align-items: start;
}

@media (min-width: 720px) {
  .product {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
}

.product__eyebrow {
  margin: 0;
  font-size: 13px;
  opacity: 0.7;
}

.product__details h3 {
  margin: 6px 0 12px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.product__details p:last-child {
  margin: 0;
  line-height: 1.6;
  opacity: 0.8;
}
</style>
