<script setup lang="ts">
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxProvider,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
  PhotoImage,
  PhotoTrigger,
  type PhotoItem,
} from '@lupinum/nuxt-photo/app'

defineProps<{ photos: readonly PhotoItem[] }>()
</script>

<template>
  <LightboxProvider :photos="photos">
    <div class="photo-viewer__thumbs">
      <PhotoTrigger
        v-for="(photo, index) in photos"
        :key="photo.id"
        v-slot="{ hidden }"
        :photo="photo"
        :index="index"
        class="photo-viewer__thumb"
      >
        <PhotoImage :photo="photo" context="thumb" :style="{ opacity: hidden ? 0 : 1 }" />
      </PhotoTrigger>
    </div>

    <LightboxRoot class="photo-viewer" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <LightboxOverlay class="photo-viewer__backdrop" />

      <LightboxViewport
        v-slot="{ photos: slides, viewportRef, isSlideMounted }"
        class="photo-viewer__viewport"
      >
        <div :ref="viewportRef" class="photo-viewer__track-window">
          <div class="photo-viewer__track">
            <template v-for="(photo, index) in slides" :key="photo.id">
              <LightboxSlide
                v-if="isSlideMounted(index)"
                :photo="photo"
                :index="index"
                class="photo-viewer__slide"
              />
              <div v-else class="photo-viewer__slide" aria-hidden="true" />
            </template>
          </div>
        </div>
      </LightboxViewport>

      <LightboxControls
        v-slot="{ activeIndex, count, close, next, prev }"
        class="photo-viewer__controls"
      >
        <span class="photo-viewer__count">{{ activeIndex + 1 }} / {{ count }}</span>
        <div class="photo-viewer__buttons">
          <button type="button" @click="prev">Previous</button>
          <button type="button" @click="next">Next</button>
          <button type="button" @click="close">Close</button>
        </div>
      </LightboxControls>

      <!-- --np-frame-* say where the photo is drawn, so the caption sits right under it. -->
      <LightboxCaption v-slot="{ photo }" class="photo-viewer__caption">
        <strong v-if="photo?.caption">{{ photo.caption }}</strong>
        <span v-if="photo?.description">{{ photo.description }}</span>
      </LightboxCaption>
    </LightboxRoot>
  </LightboxProvider>
</template>

<!-- Not scoped: LightboxRoot renders into <body>, where scoped styles do not reach. -->
<style>
.photo-viewer__thumbs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.photo-viewer__thumb {
  display: block;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 6px;
  cursor: zoom-in;
}

.photo-viewer__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* The mat: space kept free around the photo, above for the controls, below for the caption. */
.photo-viewer {
  position: fixed;
  inset: 0;
  z-index: 50;
  color: #f5f5f4;
  --np-frame-inset-top: 64px;
  --np-frame-inset-bottom: 96px;
  --np-frame-inset-inline: 24px;
}

.photo-viewer__backdrop {
  position: absolute;
  inset: 0;
  background: #111;
}

.photo-viewer__viewport,
.photo-viewer__track-window {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.photo-viewer__track {
  display: flex;
  height: 100%;
}

.photo-viewer__slide {
  display: grid;
  flex: 0 0 100%;
  min-width: 0;
  place-items: center;
}

/* A full-screen layer stays click-through; only its buttons take clicks. */
.photo-viewer__controls {
  position: absolute;
  inset: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  pointer-events: none;
}

.photo-viewer__count {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.photo-viewer__buttons {
  display: flex;
  gap: 6px;
  pointer-events: auto;
}

.photo-viewer__buttons button {
  padding: 6px 12px;
  border: 1px solid rgb(255 255 255 / 0.2);
  border-radius: 999px;
  background: rgb(255 255 255 / 0.08);
  color: inherit;
  font: inherit;
  font-size: 14px;
  cursor: pointer;
}

.photo-viewer__caption {
  position: absolute;
  top: calc(var(--np-frame-y) + var(--np-frame-height) + 14px);
  left: var(--np-frame-x);
  display: grid;
  gap: 2px;
  width: var(--np-frame-width);
  font-size: 14px;
}

.photo-viewer__caption span {
  opacity: 0.7;
}
</style>
