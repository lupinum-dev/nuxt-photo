<script setup lang="ts">
import { computed, ref } from 'vue'
import { getGalleryItems } from '../data/photos'

const items = computed(() => getGalleryItems())
const lastEvent = ref('')

function onOpen() {
  lastEvent.value = 'open'
}

function onClose() {
  lastEvent.value = 'close'
}

function onChange(index: number) {
  lastEvent.value = `change index=${index}`
}
</script>

<template>
  <div>
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            PhotoGallery
          </p>
          <h2 class="section-title">
            Custom thumbnails with events
          </h2>
          <p class="section-description">
            Uses the #thumbnail slot for styled thumbnail cards with bindThumbnail for zoom-in animation.
            Events are logged below.
          </p>
        </div>
      </div>

      <div class="thumb-grid">
        <PhotoGallery
          :items="items"
          @open="onOpen"
          @close="onClose"
          @change="onChange"
        >
          <template #thumbnail="{ item, index, open, bindThumbnail }">
            <button
              :ref="bindThumbnail"
              class="thumb"
              type="button"
              @click="open"
            >
              <img
                :src="'src' in item ? String((item as Record<string, unknown>).msrc || item.src) : ''"
                :alt="'alt' in item ? String(item.alt) : ''"
                class="thumb-img"
              >
              <span class="thumb-badge">{{ index + 1 }}</span>
              <span
                v-if="'caption' in item && item.caption"
                class="thumb-caption"
              >
                {{ item.caption }}
              </span>
            </button>
          </template>
        </PhotoGallery>
      </div>

      <div class="status">
        last event: {{ lastEvent || 'none' }}
      </div>
    </section>
  </div>
</template>

<style scoped>
.thumb-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
}

.thumb {
  appearance: none;
  background: var(--surface-dim);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: inherit;
  cursor: pointer;
  display: block;
  font: inherit;
  overflow: hidden;
  padding: 0;
  position: relative;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}

.thumb:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.thumb-img {
  aspect-ratio: 4 / 3;
  display: block;
  height: auto;
  object-fit: cover;
  width: 100%;
}

.thumb-badge {
  background: rgba(0, 0, 0, 0.55);
  border-radius: 6px;
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 2px 6px;
  position: absolute;
  right: 8px;
  top: 8px;
}

.thumb-caption {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 8px 10px;
  text-align: left;
}
</style>
