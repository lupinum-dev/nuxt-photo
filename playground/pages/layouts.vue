<template>
  <div class="page">
    <header class="header">
      <h1 class="header__title">Layout Explorer</h1>
      <p class="header__desc">
        Switch between layout algorithms and adjust parameters in real-time.
        <code>PhotoAlbum</code> handles layout + lightbox automatically.
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

    <!-- PhotoAlbum handles the lightbox automatically — no manual wiring needed -->
    <div class="album-section">
      <PhotoAlbum
        :photos="photos"
        :layout="albumLayout"
        :spacing="spacing"
      />
    </div>

    <div class="code-section">
      <h2 class="code-section__title">Usage</h2>
      <CodeExample :code="templateCode" title="Template" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AlbumLayout } from '@nuxt-photo/core'
import { photos } from '~/composables/photos'

useHead({ title: 'Layouts — nuxt-photo' })

const layouts = ['rows', 'columns', 'masonry'] as const
const layout = ref<'rows' | 'columns' | 'masonry'>('rows')
const columns = ref(3)
const spacing = ref(6)
const targetRowHeight = ref(280)

const albumLayout = computed<AlbumLayout>(() => {
  switch (layout.value) {
    case 'rows': return { type: 'rows', targetRowHeight: targetRowHeight.value }
    case 'columns': return { type: 'columns', columns: columns.value }
    case 'masonry': return { type: 'masonry', columns: columns.value }
  }
})

const templateCode = `<!-- Layer 1: album with baked-in lightbox -->
<PhotoAlbum
  :photos="photos"
  :layout="layout"
  :columns="columns"
  :spacing="spacing"
/>

<!-- Layer 2: custom thumbnail with #thumbnail slot — wiring still automatic -->
<PhotoAlbum :photos="photos" layout="rows">
  <template #thumbnail="{ photo, width, height }">
    <MyCard :photo="photo" />
  </template>
</PhotoAlbum>`
</script>

<style scoped>
.page {
  padding: 80px 48px 120px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  margin-bottom: 48px;
}

.header__title {
  margin: 0;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(32px, 5vw, 56px);
  font-weight: 400;
  letter-spacing: -0.02em;
}

.header__desc {
  margin: 16px 0 0;
  font-size: 16px;
  line-height: 1.6;
  color: rgba(237, 232, 227, 0.55);
}

.header__desc code {
  padding: 2px 7px;
  background: rgba(200, 149, 108, 0.1);
  border-radius: 3px;
  font-size: 13px;
  font-family: 'JetBrains Mono', 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(237, 232, 227, 0.75);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  margin-bottom: 48px;
  padding: 24px;
  background: rgba(255, 248, 240, 0.02);
  border: 1px solid rgba(200, 149, 108, 0.1);
  border-radius: 6px;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.control-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(237, 232, 227, 0.45);
}

.control-tabs {
  display: flex;
  gap: 0;
}

.control-tab {
  padding: 8px 16px;
  border: 0;
  border-bottom: 2px solid transparent;
  font-size: 13px;
  font-weight: 500;
  color: rgba(237, 232, 227, 0.5);
  background: transparent;
  cursor: pointer;
  transition: color 200ms ease, border-color 200ms ease;
  text-transform: capitalize;
}

.control-tab:hover {
  color: #ede8e3;
}

.control-tab--active {
  color: #c8956c;
  border-bottom-color: #c8956c;
}

.control-range {
  width: 160px;
  accent-color: #c8956c;
}

.album-section {
  margin-bottom: 64px;
}

.code-section {
  margin-bottom: 64px;
}

.code-section__title {
  margin: 0 0 16px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  letter-spacing: -0.02em;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }

  .controls {
    gap: 16px;
    padding: 16px;
  }
}
</style>
