<template>
  <LightboxRoot
    class="np-lightbox"
    role="dialog"
    aria-modal="true"
    :aria-label="labels.photoViewer"
  >
    <LightboxOverlay class="np-lightbox__backdrop">
      <!-- A soft glow of the current photo's colors; the new glow fades in over the old. -->
      <Transition name="np-ambient">
        <PhotoImage
          v-if="lightbox.activePhoto.value"
          :key="lightbox.activePhoto.value.id"
          :photo="lightbox.activePhoto.value"
          context="thumb"
          loading="eager"
          alt=""
          aria-hidden="true"
          class="np-lightbox__ambient"
        />
      </Transition>
    </LightboxOverlay>

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
                type="button"
                :aria-label="labels.previous"
                :disabled="controlsDisabled"
                @click="prev"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
              <button
                class="np-lightbox__btn np-lightbox__btn--next"
                type="button"
                :aria-label="labels.next"
                :disabled="controlsDisabled"
                @click="next"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <div class="np-lightbox__tools">
                <button
                  class="np-lightbox__btn np-lightbox__btn--zoom"
                  type="button"
                  :aria-label="isZoomedIn ? labels.fit : labels.zoom"
                  :title="isZoomedIn ? labels.fit : labels.zoom"
                  :disabled="controlsDisabled || !zoomAllowed"
                  @click="toggleZoom()"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="11" cy="11" r="6.5" />
                    <path v-if="isZoomedIn" d="M20 20l-4.2-4.2M8.5 11h5" />
                    <path v-else d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
                  </svg>
                </button>
                <button
                  class="np-lightbox__btn np-lightbox__btn--close"
                  type="button"
                  :aria-label="labels.close"
                  :title="labels.close"
                  @click="close"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
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

        <!-- The wall label: anchored under the photo through the --np-frame-* variables. -->
        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo, activeIndex }">
          <Transition name="np-caption" mode="out-in">
            <div :key="photo?.id ?? 'none'" class="np-lightbox__label">
              <slot name="caption" :photo="photo" :index="activeIndex">
                <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
                <p v-if="photo?.description">{{ photo.description }}</p>
              </slot>
            </div>
          </Transition>
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
  PhotoImage,
} from '../primitives/index'
import { useLightbox } from '../composables/useLightbox'
import { usePhotoLabels } from '../composables/usePhotoLabels'
import type {
  LightboxCaptionSlotProps,
  LightboxControlsSlotProps,
  LightboxSlideSlotProps,
} from '../types/index'

const labels = usePhotoLabels()
const lightbox = useLightbox()

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
