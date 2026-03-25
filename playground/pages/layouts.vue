<template>
  <div class="page">
    <header class="header">
      <h1 class="header__title">Layout Explorer</h1>
      <p class="header__desc">
        Switch between layout algorithms and adjust parameters in real-time.
        Uses <code>PhotoAlbum</code> + <code>Lightbox</code> composed manually via <code>useLightbox</code>.
      </p>
    </header>

    <div class="controls">
      <div class="control-group">
        <label class="control-label">Layout</label>
        <div class="control-tabs">
          <button
            v-for="l in layouts"
            :key="l"
            class="control-tab"
            :class="{ 'control-tab--active': layout === l }"
            @click="layout = l"
          >
            {{ l }}
          </button>
        </div>
      </div>

      <div v-if="layout !== 'rows'" class="control-group">
        <label class="control-label">Columns: {{ columns }}</label>
        <input type="range" :min="2" :max="6" v-model.number="columns" class="control-range" />
      </div>

      <div v-if="layout === 'rows'" class="control-group">
        <label class="control-label">Row height: {{ targetRowHeight }}px</label>
        <input type="range" :min="120" :max="500" :step="10" v-model.number="targetRowHeight" class="control-range" />
      </div>

      <div class="control-group">
        <label class="control-label">Spacing: {{ spacing }}px</label>
        <input type="range" :min="0" :max="24" v-model.number="spacing" class="control-range" />
      </div>
    </div>

    <div class="album-section">
      <PhotoAlbum
        :photos="photos"
        :layout="layout"
        :columns="columns"
        :spacing="spacing"
        :target-row-height="targetRowHeight"
      >
        <template #item="{ photo, index, width, height }">
          <div
            :ref="ctx.setThumbRef(index)"
            class="album-trigger"
            role="button"
            tabindex="0"
            :style="{
              opacity: ctx.hiddenThumbIndex.value === index ? 0 : 1,
              cursor: 'pointer',
            }"
            @click="ctx.open(index)"
            @keydown.enter="ctx.open(index)"
            @keydown.space.prevent="ctx.open(index)"
          >
            <img
              :src="photo.thumbSrc || photo.src"
              :alt="photo.alt || ''"
              loading="lazy"
              draggable="false"
              :style="{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '12px' }"
            />
          </div>
        </template>
      </PhotoAlbum>

      <Lightbox :ctx="ctx" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLightbox } from '@nuxt-photo/vue'
import { photos } from '~/composables/photos'

const layouts = ['rows', 'columns', 'masonry'] as const
const layout = ref<'rows' | 'columns' | 'masonry'>('rows')
const columns = ref(3)
const spacing = ref(6)
const targetRowHeight = ref(280)

const ctx = useLightbox(photos)
</script>

<style scoped>
.page {
  padding: 48px 24px 72px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
}

.header__title {
  margin: 0;
  font-size: clamp(28px, 4vw, 48px);
  letter-spacing: -0.03em;
}

.header__desc {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: rgba(236, 240, 255, 0.7);
}

.header__desc code {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(180, 200, 255, 0.9);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.02em;
}

.control-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  padding: 4px;
}

.control-tab {
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  background: transparent;
  cursor: pointer;
  transition: all 160ms ease;
  text-transform: capitalize;
}

.control-tab:hover {
  color: white;
}

.control-tab--active {
  color: white;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06) inset;
}

.control-range {
  width: 160px;
  accent-color: rgba(130, 150, 255, 0.8);
}

.album-trigger {
  width: 100%;
  height: 100%;
  transition: opacity 200ms ease;
}

.album-section {
  margin-bottom: 64px;
}

@media (max-width: 700px) {
  .page {
    padding: 28px 16px 48px;
  }

  .controls {
    gap: 16px;
    padding: 16px;
  }
}
</style>
