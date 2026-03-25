<template>
  <div class="demo-shell">
    <header class="hero">
      <p class="eyebrow">nuxt-photo connected-motion POC</p>
      <h1>Vue can do this elegantly.</h1>
      <p class="lede">
        Click any image. The thumbnail is picked up, moved into the viewer,
        swiped between slides, and zoomed with image-first gestures.
      </p>
    </header>

    <PhotoGallery
      :photos="photos"
      :hidden-thumb-index="hiddenThumbIndex"
      :set-thumb-ref="setThumbRef"
      @open="open"
    />

    <teleport to="body">
      <div v-if="lightboxMounted" class="lightbox-root">
        <div
          class="lightbox-backdrop"
          :style="backdropStyle"
          @click="handleBackdropClick"
        />

        <div class="lightbox-ui" :style="lightboxUiStyle">
          <div class="topbar" :style="chromeStyle">
            <div class="counter">
              {{ activeIndex + 1 }} / {{ photos.length }}
            </div>

            <div class="actions">
              <button class="ui-btn" @click="prev" :disabled="controlsDisabled">
                ←
              </button>
              <button class="ui-btn" @click="next" :disabled="controlsDisabled">
                →
              </button>
              <button class="ui-btn" @click="toggleZoom()" :disabled="controlsDisabled || !zoomAllowed">
                {{ isZoomedIn ? 'Fit' : 'Zoom' }}
              </button>
              <button class="ui-btn close-btn" @click="close" :disabled="controlsDisabled">
                ✕
              </button>
            </div>
          </div>

          <div class="stage">
            <div
              ref="mediaAreaRef"
              class="media-area"
              :class="{ 'media-area--zoomed': isZoomedIn, 'media-area--dragging': gesturePhase !== 'idle' }"
              @pointerdown.capture="onMediaPointerDown"
              @pointermove.capture="onMediaPointerMove"
              @pointerup.capture="onMediaPointerUp"
              @pointercancel.capture="onMediaPointerCancel"
              @wheel="onWheel"
            >
              <div class="embla__viewport" ref="emblaRef" :style="{ opacity: mediaOpacity }">
                <div class="embla__container">
                  <div
                    v-for="(photo, i) in photos"
                    :key="photo.id"
                    class="embla__slide"
                  >
                    <div class="slide-effect" :style="getSlideEffectStyle(i)">
                      <div class="slide-frame" :style="getSlideFrameStyle(photo)">
                        <div
                          class="slide-zoom"
                          :ref="setSlideZoomRef(i)"
                        >
                          <img
                            class="lightbox-image"
                            :src="photo.full"
                            :alt="photo.title"
                            loading="lazy"
                            draggable="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="zoomAllowed" class="zoom-hint" :style="chromeStyle">
                {{ isZoomedIn ? 'Drag to pan' : 'Double tap or use the Zoom button' }}
              </div>
            </div>

            <div class="caption" :style="chromeStyle">
              <h2>{{ currentPhoto.title }}</h2>
              <p>{{ currentPhoto.subtitle }}</p>
            </div>
          </div>
        </div>

        <img
          v-if="ghostVisible"
          class="ghost-image"
          :src="ghostSrc"
          alt=""
          aria-hidden="true"
          :style="ghostStyle"
        />
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { photos } from './data/photos'
import { useLightbox } from './composables/useLightbox'
import PhotoGallery from './components/PhotoGallery.vue'

const {
  activeIndex,
  currentPhoto,
  lightboxMounted,
  ghostVisible,
  ghostSrc,
  ghostStyle,
  hiddenThumbIndex,
  isZoomedIn,
  zoomAllowed,
  controlsDisabled,
  gesturePhase,
  mediaOpacity,

  backdropStyle,
  lightboxUiStyle,
  chromeStyle,

  mediaAreaRef,
  emblaRef,
  setThumbRef,
  setSlideZoomRef,

  onMediaPointerDown,
  onMediaPointerMove,
  onMediaPointerUp,
  onMediaPointerCancel,
  onWheel,

  open,
  close,
  next,
  prev,
  toggleZoom,
  handleBackdropClick,
  getSlideFrameStyle,
  getSlideEffectStyle,
} = useLightbox(photos)
</script>

<style scoped>
:global(html) {
  color-scheme: dark;
}

:global(body) {
  margin: 0;
  background:
    radial-gradient(circle at top, rgba(90, 110, 255, 0.18), transparent 34%),
    linear-gradient(180deg, #0b1020 0%, #090d19 100%);
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.demo-shell {
  min-height: 100vh;
  padding: 48px 24px 72px;
  color: #f5f7fb;
}

.hero {
  max-width: 840px;
  margin: 0 auto 32px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(215, 223, 255, 0.72);
}

.hero h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 64px);
  line-height: 0.96;
  letter-spacing: -0.04em;
}

.lede {
  max-width: 700px;
  margin: 16px 0 0;
  font-size: 18px;
  line-height: 1.5;
  color: rgba(236, 240, 255, 0.8);
}

.lightbox-root {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.lightbox-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top, rgba(75, 98, 255, 0.16), transparent 30%),
    rgba(5, 7, 12, 0.84);
  backdrop-filter: blur(16px) saturate(1.08);
  transition: opacity 260ms ease;
}

.lightbox-ui {
  position: absolute;
  inset: 0;
  transform-origin: center 28%;
}

.topbar {
  position: absolute;
  top: 18px;
  left: 20px;
  right: 20px;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 160ms ease;
}

.counter {
  font-size: 13px;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.72);
}

.actions {
  display: flex;
  gap: 10px;
}

.ui-btn {
  height: 42px;
  min-width: 42px;
  border: 0;
  border-radius: 999px;
  padding: 0 14px;
  cursor: pointer;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.08) inset,
    0 16px 40px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(8px);
  transition:
    transform 160ms ease,
    background 160ms ease,
    opacity 160ms ease;
}

.ui-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.16);
}

.ui-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.close-btn {
  min-width: 48px;
}

.stage {
  position: absolute;
  inset: 64px 28px 24px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 18px;
  justify-items: center;
}

.media-area {
  position: relative;
  width: min(1240px, calc(100vw - 72px));
  height: min(78vh, calc(100vh - 150px));
  overflow: hidden;
}

.media-area::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0)),
    radial-gradient(circle at top, rgba(63, 74, 168, 0.22), transparent 55%);
  border-radius: 28px;
  pointer-events: none;
  z-index: 1;
}

.media-area--zoomed {
  cursor: grab;
}

.media-area--dragging.media-area--zoomed {
  cursor: grabbing;
}

/* Embla carousel */
.embla__viewport {
  overflow: hidden;
  position: absolute;
  inset: 0;
}

.embla__container {
  display: flex;
  height: 100%;
  touch-action: pan-y pinch-zoom;
}

.embla__slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  place-items: center;
}

.slide-effect {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  will-change: transform, opacity;
  transform-origin: center center;
}

.slide-frame {
  position: relative;
  overflow: visible;
}

.slide-zoom {
  width: 100%;
  height: 100%;
  will-change: transform;
  transform-origin: center center;
}

.lightbox-image {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: 0 30px 120px rgba(0, 0, 0, 0.45);
}

.zoom-hint {
  position: absolute;
  left: 18px;
  bottom: 18px;
  z-index: 10;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(10, 12, 20, 0.48);
  backdrop-filter: blur(10px);
  transition: opacity 160ms ease;
}

.caption {
  width: min(1240px, calc(100vw - 72px));
  text-align: left;
  transition: opacity 160ms ease;
}

.caption h2 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.03em;
}

.caption p {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.72);
}

.ghost-image {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  border-radius: 18px;
}

@media (max-width: 700px) {
  .demo-shell {
    padding-inline: 16px;
    padding-top: 28px;
  }

  .stage {
    inset: 64px 12px 16px;
  }

  .media-area,
  .caption {
    width: min(100vw - 24px, 1240px);
  }

  .topbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .actions {
    gap: 8px;
  }

  .ui-btn {
    min-width: 40px;
    padding-inline: 12px;
  }
}
</style>
