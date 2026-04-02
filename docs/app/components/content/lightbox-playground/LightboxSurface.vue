<script setup lang="ts">
import { ref, watch } from 'vue'
import { type LightboxTransitionOption, provideLightboxContexts, useLightboxContext } from '@nuxt-photo/vue/extend'
import { docsLightboxPhotos } from '~/composables/useDocsDemoData'

const props = withDefaults(defineProps<{
  mode?: 'lightbox' | 'transitions' | 'gestures' | 'anatomy' | 'provider'
  transition?: LightboxTransitionOption
  minZoom?: number
}>(), {
  mode: 'lightbox',
  transition: 'auto',
  minZoom: 1,
})

const ctx = useLightboxContext(docsLightboxPhotos, props.transition, props.minZoom)
provideLightboxContexts(ctx as Parameters<typeof provideLightboxContexts>[0])

const lifecycle = ref<'closed' | 'opening' | 'open' | 'closing'>('closed')
const lastIntent = ref<'open' | 'close'>('open')

watch(
  () => [ctx.isOpen.value, ctx.transitionInProgress.value] as const,
  ([isOpen, transitioning]) => {
    if (!isOpen) {
      lifecycle.value = 'closed'
      return
    }

    if (transitioning) {
      lifecycle.value = lastIntent.value === 'close' ? 'closing' : 'opening'
      return
    }

    lifecycle.value = 'open'
  },
  { immediate: true },
)

function markOpening() {
  lastIntent.value = 'open'
  lifecycle.value = 'opening'
}

function markClosing() {
  lastIntent.value = 'close'
  lifecycle.value = 'closing'
}

async function closeLightbox() {
  markClosing()
  await ctx.close()
}
</script>

<template>
  <div class="docs-lightbox-surface">
    <div class="docs-lightbox-surface__thumbs">
      <PhotoTrigger
        v-for="(photo, index) in docsLightboxPhotos"
        :key="photo.id"
        :photo="photo"
        :index="index"
        class="docs-lightbox-surface__thumb"
        @click.capture="markOpening"
      >
        <template #default="{ hidden, photo: triggerPhoto }">
          <figure class="docs-lightbox-surface__thumb-figure" :style="{ opacity: hidden ? 0 : 1 }">
            <PhotoImage
              :photo="triggerPhoto"
              context="thumb"
              loading="lazy"
              class="docs-lightbox-surface__thumb-image"
            />
            <figcaption class="docs-lightbox-surface__thumb-caption">
              <span>{{ triggerPhoto.caption }}</span>
              <small>#{{ index + 1 }}</small>
            </figcaption>
          </figure>
        </template>
      </PhotoTrigger>
    </div>

    <div class="docs-lightbox-surface__legend">
      <span>Open a frame to inspect {{ props.mode === 'gestures' ? 'gesture and zoom state.' : 'the live lightbox state.' }}</span>
      <code>Esc</code>
      <code>←</code>
      <code>→</code>
      <code>Double-click</code>
      <code>Wheel</code>
    </div>

    <LightboxRoot class="np-lightbox docs-lightbox-surface__root" role="dialog" aria-modal="true">
      <LightboxOverlay class="np-lightbox__backdrop" @click.capture="markClosing" />

      <div class="np-lightbox__ui docs-lightbox-surface__ui">
        <LightboxControls v-slot="{ activeIndex, count, prev, next, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
          <div class="np-lightbox__topbar docs-lightbox-surface__topbar">
            <div class="docs-lightbox-surface__status">
              <span class="np-lightbox__counter">{{ activeIndex + 1 }} / {{ count }}</span>
              <span class="docs-status-chip docs-status-chip--active">{{ lifecycle }}</span>
              <span class="docs-status-chip">{{ ctx.gesturePhase.value }}</span>
              <span class="docs-status-chip">{{ isZoomedIn ? 'zoomed' : 'fit' }}</span>
            </div>

            <div class="np-lightbox__actions">
              <button class="np-lightbox__btn" :disabled="controlsDisabled" aria-label="Previous" @click="prev">&#8592;</button>
              <button class="np-lightbox__btn" :disabled="controlsDisabled" aria-label="Next" @click="next">&#8594;</button>
              <button
                class="np-lightbox__btn"
                :disabled="controlsDisabled || !zoomAllowed"
                :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
                @click="toggleZoom()"
              >
                {{ isZoomedIn ? 'Fit' : 'Zoom' }}
              </button>
              <button class="np-lightbox__btn np-lightbox__btn--close" :disabled="controlsDisabled" aria-label="Close" @click="closeLightbox">&#10005;</button>
            </div>
          </div>
        </LightboxControls>

        <div class="docs-lightbox-surface__hud">
          <div class="docs-lightbox-surface__hud-card">
            <span>Status</span>
            <strong>{{ lifecycle }}</strong>
          </div>
          <div class="docs-lightbox-surface__hud-card">
            <span>Gesture</span>
            <strong>{{ ctx.gesturePhase.value }}</strong>
          </div>
          <div class="docs-lightbox-surface__hud-card">
            <span>Zoom</span>
            <strong>{{ ctx.zoomState.value.current.toFixed(2) }}x</strong>
          </div>
          <div class="docs-lightbox-surface__hud-card">
            <span>Pan</span>
            <strong>{{ Math.round(ctx.panState.value.x) }}, {{ Math.round(ctx.panState.value.y) }}</strong>
          </div>
        </div>

        <div class="np-lightbox__stage">
          <LightboxViewport
            v-slot="{ photos, viewportRef, mediaOpacity }"
            class="np-lightbox__media"
          >
            <div class="np-lightbox__viewport" :ref="viewportRef" :style="{ opacity: mediaOpacity }">
              <div class="np-lightbox__container">
                <LightboxSlide
                  v-for="(photo, index) in photos"
                  :key="photo.id"
                  :photo="photo"
                  :index="Number(index)"
                  class="np-lightbox__slide"
                />
              </div>
            </div>
          </LightboxViewport>

          <LightboxCaption class="np-lightbox__caption">
            <template #default="{ photo }">
              <div class="docs-lightbox-surface__caption">
                <h2 v-if="photo?.caption">{{ photo.caption }}</h2>
                <p v-if="photo?.description">{{ photo.description }}</p>
                <div v-if="props.mode === 'anatomy'" class="docs-lightbox-surface__caption-tags">
                  <span class="docs-status-chip">LightboxRoot</span>
                  <span class="docs-status-chip">LightboxOverlay</span>
                  <span class="docs-status-chip">LightboxViewport</span>
                  <span class="docs-status-chip">LightboxSlide</span>
                  <span class="docs-status-chip">LightboxControls</span>
                  <span class="docs-status-chip">LightboxCaption</span>
                </div>
                <p v-if="props.mode === 'provider'" class="docs-lightbox-surface__provider-note">
                  This preview is powered by <code>useLightboxContext()</code> plus the primitives, not the recipe lightbox wrapper.
                </p>
              </div>
            </template>
          </LightboxCaption>
        </div>
      </div>

      <LightboxPortal class="np-lightbox__ghost" />
    </LightboxRoot>
  </div>
</template>
