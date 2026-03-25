<script setup lang="ts">
import { ref } from 'vue'
import type { LayoutType } from '../../src/module'
import { albumItems } from '../data/photos'

const layout = ref<LayoutType>('masonry')
const lightboxIndex = ref<number | null>(null)
const lastEvent = ref('')

const layouts: LayoutType[] = ['rows', 'columns', 'masonry']

function onLightboxOpen(payload: { index: number }) {
  lastEvent.value = `lightbox-open index=${payload.index}`
}

function onLightboxClose() {
  lastEvent.value = 'lightbox-close'
}

function onClick(payload: { index: number }) {
  lastEvent.value = `click index=${payload.index}`
}
</script>

<template>
  <div>
    <!-- Default usage with layout switcher -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            PhotoAlbum
          </p>
          <h2 class="section-title">
            Layout modes &amp; controlled lightbox
          </h2>
          <p class="section-description">
            Switch between rows, columns, and masonry. The wrapper owns the lightbox; the base album owns layout only.
          </p>
        </div>

        <div class="controls">
          <button
            v-for="l in layouts"
            :key="l"
            class="btn"
            :class="{ 'btn--active': layout === l }"
            type="button"
            @click="layout = l"
          >
            {{ l }}
          </button>
          <button
            class="btn"
            type="button"
            @click="lightboxIndex = 0"
          >
            Open first
          </button>
          <button
            class="btn"
            type="button"
            @click="lightboxIndex = albumItems.length - 1"
          >
            Open last
          </button>
          <button
            class="btn"
            type="button"
            @click="lightboxIndex = null"
          >
            Close
          </button>
        </div>
      </div>

      <PhotoLightboxAlbum
        v-model:lightbox-index="lightboxIndex"
        :items="albumItems"
        :layout="layout"
        :columns="{ 0: 2, 768: 3, 1280: 4 }"
        :spacing="{ 0: 8, 768: 12, 1280: 14 }"
        :padding="0"
        :target-row-height="{ 0: 160, 768: 200, 1280: 240 }"
        :image="{
          sizes: 'sm:46vw md:31vw xl:22vw',
        }"
        @click="onClick"
        @lightbox-open="onLightboxOpen"
        @lightbox-close="onLightboxClose"
      />

      <div class="status">
        lightboxIndex: {{ lightboxIndex ?? 'null' }} &nbsp;|&nbsp; layout: {{ layout }}
        <template v-if="lastEvent">
          &nbsp;|&nbsp; last event: {{ lastEvent }}
        </template>
      </div>
    </section>

    <!-- Custom slot -->
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            Custom Slot
          </p>
          <h2 class="section-title">
            Custom #photo slot
          </h2>
          <p class="section-description">
            Renders each photo with a custom card overlay showing caption and layout metadata.
          </p>
        </div>
      </div>

      <PhotoAlbum
        :items="albumItems.slice(0, 6)"
        layout="masonry"
        :columns="{ 0: 2, 768: 3 }"
        :spacing="{ 0: 10, 768: 12 }"
        :padding="0"
      >
        <template #photo="{ item, imageProps, layout: photoLayout }">
          <div
            class="photo-card"
          >
            <PhotoImage
              v-bind="imageProps"
              class="photo-card-img"
            />
            <span class="photo-card-overlay">
              <strong>{{ item.caption || item.alt }}</strong>
              <span>{{ photoLayout.mode }} #{{ photoLayout.index + 1 }}</span>
            </span>
          </div>
        </template>
      </PhotoAlbum>
    </section>
  </div>
</template>

<style scoped>
.photo-card {
  appearance: none;
  background: none;
  border: 0;
  border-radius: var(--radius);
  color: inherit;
  cursor: zoom-in;
  display: block;
  font: inherit;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.photo-card-img {
  display: block;
  height: auto;
  width: 100%;
}

.photo-card-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  bottom: 0;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 2px;
  left: 0;
  padding: 32px 12px 10px;
  position: absolute;
  right: 0;
}

.photo-card-overlay strong {
  font-size: 0.8125rem;
}

.photo-card-overlay span {
  font-size: 0.6875rem;
  opacity: 0.7;
}
</style>
