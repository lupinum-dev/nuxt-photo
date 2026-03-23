<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LightboxOptions } from '../../src/module'
import { getCustomLightboxItems } from '../data/photos'

type LightboxRef = {
  close: () => void
  open: (
    index?: number,
    overrideOptions?: LightboxOptions,
    sourceElement?: HTMLElement | null,
    initialPointerPos?: { x: number, y: number } | null,
  ) => boolean | undefined
  setUiVisible: (isVisible: boolean) => void
}

const lightboxRef = ref<LightboxRef | null>(null)
const items = computed(() => getCustomLightboxItems())

function openAt(index: number) {
  lightboxRef.value?.open(index, {
    showDuration: 0,
    hideDuration: 0,
    openAnimation: 'none',
    closeAnimation: 'none',
  })
}
</script>

<template>
  <div>
    <section class="section">
      <div class="section-header">
        <div>
          <p class="section-label">
            PhotoLightbox
          </p>
          <h2 class="section-title">
            Programmatic control &amp; custom slides
          </h2>
          <p class="section-description">
            Open the lightbox at any index. Slides 3 and 5 are custom (non-image) slides rendered through the #slide slot.
          </p>
        </div>
      </div>

      <div class="controls">
        <button
          v-for="(item, i) in items"
          :key="i"
          class="btn"
          type="button"
          @click="openAt(i)"
        >
          {{ item.type === 'custom' ? `Custom: ${item.title}` : `Image ${i + 1}` }}
        </button>
      </div>
    </section>

    <PhotoLightbox
      ref="lightboxRef"
      :items="items"
      :options="{
        showDuration: 0,
        hideDuration: 0,
      }"
    >
      <template #controls="{ close, prev, next, setUiVisible, state: ctrlState }">
        <div class="lightbox-controls">
          <button
            class="lightbox-btn"
            type="button"
            :disabled="!ctrlState.isOpen.value"
            @click="prev"
          >
            Prev
          </button>
          <span class="lightbox-counter">
            {{ ctrlState.currIndex.value + 1 }} / {{ ctrlState.totalItems.value }}
          </span>
          <button
            class="lightbox-btn"
            type="button"
            :disabled="!ctrlState.isOpen.value"
            @click="next"
          >
            Next
          </button>
          <button
            class="lightbox-btn"
            type="button"
            @click="setUiVisible(!ctrlState.uiVisible.value)"
          >
            {{ ctrlState.uiVisible.value ? 'Hide UI' : 'Show UI' }}
          </button>
          <button
            class="lightbox-btn lightbox-btn--close"
            type="button"
            @click="close"
          >
            Close
          </button>
        </div>
      </template>

      <template #slide="{ item, isActive }">
        <article
          v-if="item.type === 'custom'"
          class="custom-slide"
          :class="{ 'custom-slide--active': isActive }"
        >
          <div class="custom-slide-inner">
            <p class="custom-slide-label">
              Custom Slide
            </p>
            <h3 class="custom-slide-title">
              {{ item.title }}
            </h3>
            <p class="custom-slide-body">
              This content is rendered through the Vue #slide slot instead of from an image source.
              It demonstrates the custom-content path of the lightbox runtime.
            </p>
          </div>
        </article>
      </template>
    </PhotoLightbox>
  </div>
</template>

<style scoped>
.custom-slide {
  align-items: center;
  display: flex;
  height: 100%;
  inset: 0;
  justify-content: center;
  position: absolute;
  width: 100%;
}

.custom-slide-inner {
  background: linear-gradient(135deg, #134e4a, #1e3a5f);
  border-radius: 16px;
  color: white;
  max-width: 480px;
  padding: 40px 32px;
}

.custom-slide--active .custom-slide-inner {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.custom-slide-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  margin: 0 0 8px;
  opacity: 0.7;
  text-transform: uppercase;
}

.custom-slide-title {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 0 0 12px;
}

.custom-slide-body {
  font-size: 0.875rem;
  line-height: 1.7;
  margin: 0;
  opacity: 0.85;
}

.lightbox-controls {
  align-items: center;
  bottom: 0;
  display: flex;
  gap: 8px;
  justify-content: center;
  left: 0;
  padding: 16px;
  position: absolute;
  right: 0;
  z-index: 10;
}

.lightbox-btn {
  appearance: none;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 6px 14px;
}

.lightbox-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.lightbox-btn--close {
  margin-left: auto;
}

.lightbox-counter {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8125rem;
  font-weight: 500;
}
</style>
