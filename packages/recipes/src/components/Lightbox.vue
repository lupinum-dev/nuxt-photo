<template>
  <LightboxRoot
    class="np-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label="Photo viewer"
  >
    <LightboxOverlay class="np-lightbox__backdrop" />

    <div class="np-lightbox__ui">
      <LightboxControls
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
              {{ activeIndex + 1 }} / {{ count }}
            </div>
          </slot>

          <div class="np-lightbox__actions">
            <slot
              name="actions"
              :prev="prev"
              :next="next"
              :close="close"
              :toggle-zoom="toggleZoom"
              :is-zoomed-in="isZoomedIn"
              :zoom-allowed="zoomAllowed"
              :controls-disabled="controlsDisabled"
            >
              <button
                class="np-lightbox__btn"
                aria-label="Previous"
                :disabled="controlsDisabled"
                @click="prev"
              >
                &#8592;
              </button>
              <button
                class="np-lightbox__btn"
                aria-label="Next"
                :disabled="controlsDisabled"
                @click="next"
              >
                &#8594;
              </button>
              <button
                class="np-lightbox__btn"
                :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
                :disabled="controlsDisabled || !zoomAllowed"
                @click="toggleZoom()"
              >
                {{ isZoomedIn ? 'Fit' : 'Zoom' }}
              </button>
              <button
                class="np-lightbox__btn np-lightbox__btn--close"
                aria-label="Close"
                :disabled="controlsDisabled"
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
          v-slot="{ photos, viewportRef, mediaOpacity }"
          class="np-lightbox__media"
        >
          <div
            class="np-lightbox__viewport"
            :ref="viewportRef"
            :style="{ opacity: mediaOpacity }"
          >
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
        </LightboxViewport>

        <LightboxCaption
          class="np-lightbox__caption"
          v-slot="{ photo, activeIndex }"
        >
          <slot name="caption" :photo="photo" :index="activeIndex">
            <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
            <p v-if="photo?.description">{{ photo.description }}</p>
          </slot>
        </LightboxCaption>
      </div>
    </div>

    <LightboxPortal class="np-lightbox__ghost" />
  </LightboxRoot>
</template>

<script setup lang="ts">
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxPortal,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
} from '@nuxt-photo/vue'
import type {
  LightboxCaptionSlotProps,
  LightboxControlsSlotProps,
  LightboxSlideSlotProps,
} from '@nuxt-photo/vue'

interface LightboxCounterSlotProps {
  activeIndex: number
  count: number
}

interface LightboxActionsSlotProps extends Omit<
  LightboxControlsSlotProps,
  'activeIndex' | 'activePhoto' | 'photos' | 'count'
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
