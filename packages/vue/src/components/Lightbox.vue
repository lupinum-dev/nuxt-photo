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
          <slot name="counter" :active-index="activeIndex" :count="count">
            <div class="np-lightbox__counter">
              <span aria-hidden="true">{{ activeIndex + 1 }} / {{ count }}</span>
            </div>
          </slot>

          <div class="np-lightbox__actions">
            <slot
              name="actions"
              :active-index="activeIndex"
              :count="count"
              :prev="prev"
              :next="next"
              :close="close"
              :toggle-zoom="toggleZoom"
              :is-zoomed-in="isZoomedIn"
              :zoom-allowed="zoomAllowed"
              :controls-disabled="controlsDisabled"
            >
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
            </slot>
          </div>
        </div>
      </LightboxControls>

      <div class="np-lightbox__stage">
        <LightboxViewport
          v-slot="{ photos, viewportRef, imageLoadFailed }"
          class="np-lightbox__media"
        >
          <div class="np-lightbox__viewport" :ref="viewportRef">
            <div class="np-lightbox__container">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="np-lightbox__slide"
              >
                <template v-if="$slots.slide" #default="slotProps">
                  <slot name="slide" v-bind="slotProps" />
                </template>
              </LightboxSlide>
            </div>
          </div>
          <div v-if="imageLoadFailed" class="np-lightbox__fallback" role="status">
            {{ labels.loadFailed }}
          </div>
        </LightboxViewport>

        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo, activeIndex }">
          <slot name="caption" :photo="photo" :index="activeIndex">
            <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
            <p v-if="photo?.description">{{ photo.description }}</p>
          </slot>
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
} from '../primitives/index'
import { usePhotoLabels } from '../composables/usePhotoLabels'
import type {
  LightboxCaptionSlotProps,
  LightboxControlsSlotProps,
  LightboxSlideSlotProps,
} from '../types/index'

const labels = usePhotoLabels()

interface LightboxCounterSlotProps {
  activeIndex: number
  count: number
}

interface LightboxActionsSlotProps extends Omit<
  LightboxControlsSlotProps,
  'activePhoto' | 'photos'
> {}

interface LightboxCaptionRecipeSlotProps {
  photo: LightboxCaptionSlotProps['photo']
  index: number
}

defineSlots<{
  counter?: (props: LightboxCounterSlotProps) => unknown
  actions?: (props: LightboxActionsSlotProps) => unknown
  slide?: (props: LightboxSlideSlotProps) => unknown
  caption?: (props: LightboxCaptionRecipeSlotProps) => unknown
}>()
</script>
