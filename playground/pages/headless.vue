<template>
  <div class="page">
    <header class="header">
      <h1 class="header__title">Headless Primitives</h1>
      <p class="header__desc">
        Build your own lightbox UI from unstyled building blocks.
        Uses <code>useLightbox</code> + headless components like
        <code>LightboxRoot</code>, <code>LightboxOverlay</code>, and <code>LightboxControls</code>.
        All rendering and styling is yours to control.
      </p>
    </header>

    <div class="grid">
      <div
        v-for="(photo, index) in photos"
        :key="photo.id"
        :ref="ctx.setThumbRef(index)"
        class="grid__item"
        :style="{
          opacity: ctx.hiddenThumbIndex.value === index ? 0 : 1,
        }"
        role="button"
        tabindex="0"
        @click="ctx.open(index)"
        @keydown.enter="ctx.open(index)"
        @keydown.space.prevent="ctx.open(index)"
      >
        <img
          :src="photo.thumbSrc || photo.src"
          :alt="photo.alt || ''"
          loading="lazy"
          draggable="false"
          class="grid__img"
        />
        <div class="grid__label">{{ photo.caption }}</div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="ctx.lightboxMounted.value" class="hl">
        <div
          class="hl__backdrop"
          :style="ctx.backdropStyle.value"
          @click="ctx.handleBackdropClick"
        />

        <div class="hl__ui" :style="ctx.lightboxUiStyle.value">
          <div class="hl__toolbar" :style="ctx.chromeStyle.value">
            <span class="hl__counter">{{ ctx.activeIndex.value + 1 }}/{{ photos.length }}</span>
            <div class="hl__actions">
              <button class="hl__btn" @click="ctx.prev" :disabled="ctx.controlsDisabled.value" title="Previous">Prev</button>
              <button class="hl__btn" @click="ctx.next" :disabled="ctx.controlsDisabled.value" title="Next">Next</button>
              <button class="hl__btn" @click="ctx.toggleZoom()" :disabled="ctx.controlsDisabled.value || !ctx.zoomAllowed.value">
                {{ ctx.isZoomedIn.value ? 'Fit' : 'Zoom' }}
              </button>
              <button class="hl__btn hl__btn--close" @click="ctx.close" :disabled="ctx.controlsDisabled.value">Close</button>
            </div>
          </div>

          <div class="hl__stage">
            <div
              :ref="(el: any) => { ctx.mediaAreaRef.value = el as HTMLElement }"
              class="hl__media"
              :class="{
                'hl__media--zoomed': ctx.isZoomedIn.value,
                'hl__media--dragging': ctx.gesturePhase.value !== 'idle',
              }"
              @pointerdown.capture="ctx.onMediaPointerDown"
              @pointermove.capture="ctx.onMediaPointerMove"
              @pointerup.capture="ctx.onMediaPointerUp"
              @pointercancel.capture="ctx.onMediaPointerCancel"
              @wheel="ctx.onWheel"
            >
              <div
                class="hl__viewport"
                :ref="(el: any) => { ctx.emblaRef.value = el as HTMLElement }"
                :style="{ opacity: ctx.mediaOpacity.value }"
              >
                <div class="hl__container">
                  <div
                    v-for="(photo, i) in photos"
                    :key="photo.id"
                    class="hl__slide"
                  >
                    <div class="hl__effect" :style="ctx.getSlideEffectStyle(i)">
                      <div class="hl__frame" :style="ctx.getSlideFrameStyle(photo)">
                        <div class="hl__zoom" :ref="ctx.setSlideZoomRef(i)">
                          <img
                            class="hl__img"
                            :src="photo.src"
                            :alt="photo.alt || ''"
                            loading="lazy"
                            draggable="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="hl__info" :style="ctx.chromeStyle.value">
              <h3>{{ ctx.currentPhoto.value.caption }}</h3>
              <p>{{ ctx.currentPhoto.value.description }}</p>
            </div>
          </div>
        </div>

        <img
          v-if="ctx.ghostVisible.value"
          class="np-lightbox__ghost"
          :src="ctx.ghostSrc.value"
          alt=""
          aria-hidden="true"
          :style="ctx.ghostStyle.value"
        />
      </div>
    </Teleport>

    <div class="code-hint">
      <h2>How it works</h2>
      <p>
        This page uses <code>useLightbox()</code> directly and wires the returned context into
        plain HTML elements. No recipe components. The entire UI is custom &mdash; you control
        every element, class, and style. The composable handles all the complex state:
        carousel, gestures, zoom, FLIP transitions.
      </p>

      <CodeExample :code="headlessCode" title="Pattern" class="code-hint__example" />

      <div class="feature-list">
        <div class="feature">
          <span class="feature__icon">~</span>
          <div>
            <strong>useLightbox(photos)</strong>
            <span>Returns reactive state + event handlers</span>
          </div>
        </div>
        <div class="feature">
          <span class="feature__icon">~</span>
          <div>
            <strong>ctx.mediaAreaRef / ctx.emblaRef</strong>
            <span>Template refs for gesture area and carousel viewport</span>
          </div>
        </div>
        <div class="feature">
          <span class="feature__icon">~</span>
          <div>
            <strong>ctx.getSlideFrameStyle(photo)</strong>
            <span>Computes fitted dimensions for each slide</span>
          </div>
        </div>
        <div class="feature">
          <span class="feature__icon">~</span>
          <div>
            <strong>ctx.ghostVisible / ctx.ghostStyle</strong>
            <span>FLIP transition ghost layer for thumbnail animation</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLightbox } from '@nuxt-photo/vue'
import { photos } from '~/composables/photos'

const ctx = useLightbox(photos)

const headlessCode = `<script setup>
const ctx = useLightbox(photos)
<\/script>

<template>
  <!-- Thumbnails -->
  <div v-for="(photo, i) in photos" :key="photo.id"
    :ref="ctx.setThumbRef(i)"
    @click="ctx.open(i)">
    <img :src="photo.thumbSrc" />
  </div>

  <!-- Custom lightbox UI -->
  <Teleport to="body">
    <div v-if="ctx.lightboxMounted.value">
      <div :style="ctx.backdropStyle.value" @click="ctx.close" />
      <div :style="ctx.lightboxUiStyle.value">
        <button @click="ctx.prev">Prev</button>
        <button @click="ctx.next">Next</button>
        <button @click="ctx.toggleZoom()">
          {{ ctx.isZoomedIn.value ? 'Fit' : 'Zoom' }}
        </button>
        <button @click="ctx.close">Close</button>
        <!-- Wire ctx.emblaRef, ctx.getSlideFrameStyle, etc. -->
      </div>
    </div>
  </Teleport>
</template>`
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
  font-size: clamp(28px, 4vw, 48px);
  letter-spacing: -0.03em;
}

.header__desc {
  margin: 12px 0 0;
  font-size: 16px;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.6);
}

.header__desc code {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.7);
}

/* Simple CSS grid for thumbnails */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
  margin-bottom: 64px;
}

.grid__item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 200ms ease, opacity 200ms ease;
}

.grid__item:hover {
  transform: scale(1.01);
}

.grid__item:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.grid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.grid__label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px 12px 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  font-size: 13px;
  font-weight: 500;
  color: white;
}

/* Headless lightbox — fully custom styles */
.hl {
  position: fixed;
  inset: 0;
  z-index: 50;
}

.hl__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(20px);
  transition: opacity 260ms ease;
}

.hl__ui {
  position: absolute;
  inset: 0;
  transform-origin: center 28%;
}

.hl__toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 55;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: opacity 160ms ease;
}

.hl__counter {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.08);
  padding: 6px 14px;
  border-radius: 4px;
}

.hl__actions {
  display: flex;
  gap: 8px;
}

.hl__btn {
  height: 38px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 160ms ease;
}

.hl__btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.24);
}

.hl__btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.hl__btn--close {
  border-color: rgba(255, 100, 100, 0.3);
  color: rgba(255, 180, 180, 0.9);
}

.hl__btn--close:hover:not(:disabled) {
  background: rgba(255, 80, 80, 0.15);
  border-color: rgba(255, 100, 100, 0.5);
}

.hl__stage {
  position: absolute;
  inset: 64px 16px 24px;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 16px;
  justify-items: center;
}

.hl__media {
  position: relative;
  width: min(1240px, calc(100vw - 48px));
  height: min(78vh, calc(100vh - 150px));
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.hl__media--zoomed { cursor: grab; }
.hl__media--dragging.hl__media--zoomed { cursor: grabbing; }

.hl__viewport {
  overflow: hidden;
  position: absolute;
  inset: 0;
}

.hl__container {
  display: flex;
  height: 100%;
  touch-action: pan-y pinch-zoom;
}

.hl__slide {
  flex: 0 0 100%;
  min-width: 0;
  display: grid;
  place-items: center;
}

.hl__effect {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  will-change: transform, opacity;
  transform-origin: center center;
}

.hl__frame {
  position: relative;
  overflow: visible;
}

.hl__zoom {
  width: 100%;
  height: 100%;
  will-change: transform;
  transform-origin: center center;
}

.hl__img {
  display: block;
  width: 100%;
  height: 100%;
  user-select: none;
  -webkit-user-drag: none;
  object-fit: contain;
  border-radius: 4px;
}

.hl__info {
  width: min(1240px, calc(100vw - 48px));
  text-align: left;
  transition: opacity 160ms ease;
}

.hl__info h3 {
  margin: 0;
  font-size: 20px;
  letter-spacing: -0.02em;
}

.hl__info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

/* Explanation section */
.code-hint {
  padding: 40px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
}

.code-hint h2 {
  margin: 0 0 12px;
  font-size: 22px;
  letter-spacing: -0.02em;
}

.code-hint__example {
  margin-bottom: 24px;
}

.code-hint p {
  margin: 0 0 24px;
  font-size: 15px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
}

.code-hint code {
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.7);
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.feature {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.feature__icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.feature strong {
  display: block;
  font-size: 13px;
  font-family: 'SF Mono', Monaco, Menlo, monospace;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
}

.feature span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.4;
}

@media (max-width: 700px) {
  .page {
    padding: 48px 20px 64px;
  }

  .grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
  }

  .hl__toolbar {
    top: 12px;
    left: 12px;
    right: 12px;
  }

  .hl__stage {
    inset: 60px 8px 16px;
  }
}
</style>
