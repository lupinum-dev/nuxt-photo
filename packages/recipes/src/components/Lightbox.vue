<template>
  <Teleport to="body">
    <div v-if="ctx.lightboxMounted.value" class="np-lightbox">
      <!-- Backdrop -->
      <div
        class="np-lightbox__backdrop"
        :style="ctx.backdropStyle.value"
        @click="ctx.handleBackdropClick"
      />

      <!-- UI layer -->
      <div class="np-lightbox__ui" :style="ctx.lightboxUiStyle.value">
        <!-- Controls -->
        <div class="np-lightbox__topbar" :style="ctx.chromeStyle.value">
          <slot name="counter" :active-index="ctx.activeIndex.value" :count="ctx.photos.length">
            <div class="np-lightbox__counter">
              {{ ctx.activeIndex.value + 1 }} / {{ ctx.photos.length }}
            </div>
          </slot>

          <div class="np-lightbox__actions">
            <slot name="actions" :prev="ctx.prev" :next="ctx.next" :close="ctx.close" :toggle-zoom="ctx.toggleZoom" :is-zoomed-in="ctx.isZoomedIn.value" :zoom-allowed="ctx.zoomAllowed.value" :controls-disabled="ctx.controlsDisabled.value">
              <button class="np-lightbox__btn" @click="ctx.prev" :disabled="ctx.controlsDisabled.value">&#8592;</button>
              <button class="np-lightbox__btn" @click="ctx.next" :disabled="ctx.controlsDisabled.value">&#8594;</button>
              <button class="np-lightbox__btn" @click="ctx.toggleZoom()" :disabled="ctx.controlsDisabled.value || !ctx.zoomAllowed.value">
                {{ ctx.isZoomedIn.value ? 'Fit' : 'Zoom' }}
              </button>
              <button class="np-lightbox__btn np-lightbox__btn--close" @click="ctx.close" :disabled="ctx.controlsDisabled.value">&#10005;</button>
            </slot>
          </div>
        </div>

        <!-- Stage -->
        <div class="np-lightbox__stage">
          <div
            ref="ctx.mediaAreaRef"
            class="np-lightbox__media"
            :class="{
              'np-lightbox__media--zoomed': ctx.isZoomedIn.value,
              'np-lightbox__media--dragging': ctx.gesturePhase.value !== 'idle',
            }"
            @pointerdown.capture="ctx.onMediaPointerDown"
            @pointermove.capture="ctx.onMediaPointerMove"
            @pointerup.capture="ctx.onMediaPointerUp"
            @pointercancel.capture="ctx.onMediaPointerCancel"
            @wheel="ctx.onWheel"
          >
            <div class="np-lightbox__viewport" ref="ctx.emblaRef" :style="{ opacity: ctx.mediaOpacity.value }">
              <div class="np-lightbox__container">
                <div
                  v-for="(photo, i) in ctx.photos"
                  :key="photo.id"
                  class="np-lightbox__slide"
                >
                  <div class="np-lightbox__effect" :style="ctx.getSlideEffectStyle(i)">
                    <div class="np-lightbox__frame" :style="ctx.getSlideFrameStyle(photo)">
                      <div class="np-lightbox__zoom" :ref="ctx.setSlideZoomRef(i)">
                        <slot name="slide" :photo="photo" :index="i">
                          <img
                            class="np-lightbox__img"
                            :src="photo.src"
                            :alt="photo.alt || ''"
                            loading="lazy"
                            draggable="false"
                          />
                        </slot>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Caption -->
          <div class="np-lightbox__caption" :style="ctx.chromeStyle.value">
            <slot name="caption" :photo="ctx.currentPhoto.value" :index="ctx.activeIndex.value">
              <h2 v-if="ctx.currentPhoto.value.caption">{{ ctx.currentPhoto.value.caption }}</h2>
              <p v-if="ctx.currentPhoto.value.description">{{ ctx.currentPhoto.value.description }}</p>
            </slot>
          </div>
        </div>
      </div>

      <!-- Ghost transition image -->
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
</template>

<script setup lang="ts">
import type { LightboxContext } from '@nuxt-photo/vue'

const props = defineProps<{
  ctx: LightboxContext
}>()

const ctx = props.ctx
</script>
