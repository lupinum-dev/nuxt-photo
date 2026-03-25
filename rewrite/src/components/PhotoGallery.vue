<template>
  <section class="gallery">
    <button
      v-for="(photo, index) in photos"
      :key="photo.id"
      :ref="setThumbRef(index)"
      class="thumb"
      :class="{ 'thumb-hidden': hiddenThumbIndex === index }"
      :style="{ aspectRatio: `${photo.width} / ${photo.height}` }"
      @click="$emit('open', index)"
    >
      <img
        class="thumb-image"
        :src="photo.thumb"
        :alt="photo.title"
        draggable="false"
      />
      <div class="thumb-gradient" />
      <div class="thumb-meta">
        <strong>{{ photo.title }}</strong>
        <span>{{ photo.subtitle }}</span>
      </div>
    </button>
  </section>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { Photo } from '../types'

defineProps<{
  photos: Photo[]
  hiddenThumbIndex: number | null
  setThumbRef: (index: number) => (value: Element | ComponentPublicInstance | null) => void
}>()

defineEmits<{
  open: [index: number]
}>()
</script>

<style scoped>
.gallery {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}

.thumb {
  position: relative;
  grid-column: span 4;
  overflow: hidden;
  border: 0;
  padding: 0;
  cursor: zoom-in;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 20px 50px rgba(0, 0, 0, 0.22);
  transform: translateY(0);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.thumb:hover {
  transform: translateY(-3px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 26px 56px rgba(0, 0, 0, 0.28);
}

.thumb-hidden {
  visibility: hidden;
}

.thumb-image {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: cover;
}

.thumb-gradient {
  position: absolute;
  inset: auto 0 0;
  height: 50%;
  background: linear-gradient(to top, rgba(5, 8, 16, 0.82), transparent);
}

.thumb-meta {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  display: grid;
  gap: 2px;
  text-align: left;
  color: white;
}

.thumb-meta strong {
  font-size: 15px;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.thumb-meta span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
}

@media (max-width: 980px) {
  .thumb {
    grid-column: span 6;
  }
}

@media (max-width: 700px) {
  .thumb {
    grid-column: span 12;
  }
}
</style>
