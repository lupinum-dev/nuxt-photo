<template>
  <LightboxRoot class="np-lightbox" role="dialog" aria-modal="true">
    <LightboxOverlay class="np-lightbox__backdrop" />

    <div class="np-lightbox__ui">
      <LightboxControls v-slot="{ activeIndex, activePhoto, photos, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
        <SlotProxy
          v-if="slots?.toolbar"
          :render="slots!.toolbar"
          :props="{ activeIndex, activePhoto, photos, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }"
        />
        <div v-else class="np-lightbox__topbar">
          <div class="np-lightbox__counter">
            {{ activeIndex + 1 }} / {{ count }}
          </div>

          <div class="np-lightbox__actions">
            <button class="np-lightbox__btn" aria-label="Previous" :disabled="controlsDisabled" @click="prev">&#8592;</button>
            <button class="np-lightbox__btn" aria-label="Next" :disabled="controlsDisabled" @click="next">&#8594;</button>
            <button
              class="np-lightbox__btn"
              :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
              :disabled="controlsDisabled || !zoomAllowed"
              @click="toggleZoom()"
            >
              {{ isZoomedIn ? 'Fit' : 'Zoom' }}
            </button>
            <button class="np-lightbox__btn np-lightbox__btn--close" aria-label="Close" :disabled="controlsDisabled" @click="close">&#10005;</button>
          </div>
        </div>
      </LightboxControls>

      <div class="np-lightbox__stage">
        <LightboxViewport
          v-slot="{ photos, viewportRef, mediaOpacity }"
          class="np-lightbox__media"
        >
          <div class="np-lightbox__viewport" :ref="viewportRef" :style="{ opacity: mediaOpacity }">
            <div class="np-lightbox__container">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="np-lightbox__slide"
              >
                <template v-if="slots?.slide" #default="slotProps">
                  <SlotProxy :render="slots!.slide!" :props="slotProps" />
                </template>
              </LightboxSlide>
            </div>
          </div>
        </LightboxViewport>

        <LightboxCaption class="np-lightbox__caption" v-slot="{ photo, activeIndex }">
          <SlotProxy v-if="slots?.caption" :render="slots!.caption" :props="{ photo, activeIndex }" />
          <template v-else>
            <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
            <p v-if="photo?.description">{{ photo.description }}</p>
          </template>
        </LightboxCaption>
      </div>
    </div>

    <LightboxPortal class="np-lightbox__ghost" />
  </LightboxRoot>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import {
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxPortal,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
} from '@nuxt-photo/vue'
import { LightboxSlotsKey } from '@nuxt-photo/vue/extend'
import SlotProxy from './SlotProxy'

const slots = inject(LightboxSlotsKey, null)
</script>
