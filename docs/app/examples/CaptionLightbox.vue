<script setup lang="ts">
import { Lightbox } from '@lupinum/nuxt-photo/app'
</script>

<template>
  <!-- A wider mat on the sides, and room below for a two-line caption. -->
  <Lightbox class="caption-lightbox">
    <template #counter="{ activeIndex, count }">
      <span class="caption-lightbox__counter">{{ activeIndex + 1 }} of {{ count }}</span>
    </template>

    <template #caption="{ photo, index }">
      <p class="caption-lightbox__eyebrow">Frame {{ index + 1 }}</p>
      <h2 v-if="photo?.caption" class="caption-lightbox__title">{{ photo.caption }}</h2>
      <p v-if="photo?.description" class="caption-lightbox__text">{{ photo.description }}</p>
    </template>
  </Lightbox>
</template>

<style>
/* Both classes sit on the same element, so this wins over the theme defaults. */
.np-lightbox.caption-lightbox {
  --np-frame-inset-inline: clamp(24px, 12vw, 200px);
  --np-caption-reserve: 120px;
}

.caption-lightbox__counter {
  color: #f4f3f0;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.caption-lightbox__eyebrow {
  color: #f4f3f0;
  margin: 0 0 4px;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.6;
}

.caption-lightbox__title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.caption-lightbox__text {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.75;
}
</style>
