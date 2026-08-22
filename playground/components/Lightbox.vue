<template>
  <LightboxRoot
    class="np-lightbox"
    role="dialog"
    aria-modal="true"
    :aria-label="labels.photoViewer"
  >
    <LightboxOverlay class="np-lightbox__backdrop" />

    <div class="np-lightbox__ui">
      <LightboxControls
        class="np-lightbox__controls"
        v-slot="{
          activeIndex,
          count,
          prev,
          next,
          close,
          toggleZoom,
          isZoomedIn,
          zoomAllowed,
          controlsDisabled,
        }"
      >
        <div class="np-lightbox__topbar">
          <div class="np-lightbox__counter">
            <span aria-hidden="true">{{ activeIndex + 1 }} / {{ count }}</span>
          </div>

          <div class="np-lightbox__actions">
            <button
              class="np-lightbox__btn np-lightbox__btn--prev"
              :aria-label="labels.previous"
              :disabled="controlsDisabled"
              @click="prev"
            >
              &#8592;
            </button>
            <button
              class="np-lightbox__btn np-lightbox__btn--next"
              :aria-label="labels.next"
              :disabled="controlsDisabled"
              @click="next"
            >
              &#8594;
            </button>
            <button
              class="np-lightbox__btn np-lightbox__btn--zoom"
              :aria-label="isZoomedIn ? labels.fit : labels.zoom"
              :disabled="controlsDisabled || !zoomAllowed"
              @click="toggleZoom()"
            >
              {{ isZoomedIn ? labels.fit : labels.zoom }}
            </button>
            <button
              class="np-lightbox__btn np-lightbox__btn--close"
              :aria-label="labels.close"
              @click="close"
            >
              &#10005;
            </button>
          </div>
        </div>
      </LightboxControls>

      <div class="np-lightbox__stage">
        <LightboxViewport v-slot="{ photos, viewportRef }" class="np-lightbox__media">
          <div class="np-lightbox__viewport" :ref="viewportRef">
            <div class="np-lightbox__container">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="np-lightbox__slide"
              />
            </div>
          </div>
        </LightboxViewport>

        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo }">
          <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
          <p v-if="photo?.description">{{ photo.description }}</p>
        </LightboxCaption>
      </div>
    </div>
  </LightboxRoot>
</template>

<script setup lang="ts">
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
  usePhotoLabels,
} from '@lupinum/nuxt-photo/app'

const labels = usePhotoLabels()
</script>
