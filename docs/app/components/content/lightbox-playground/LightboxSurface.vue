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
  <div>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(136px,1fr))] gap-3">
      <PhotoTrigger
        v-for="(photo, index) in docsLightboxPhotos"
        :key="photo.id"
        :photo="photo"
        :index="index"
        class="rounded-2xl overflow-hidden cursor-pointer thumb-hover"
        @click.capture="markOpening"
      >
        <template #default="{ hidden, photo: triggerPhoto }">
          <figure class="m-0 relative rounded-2xl overflow-hidden bg-muted" :style="{ opacity: hidden ? 0 : 1 }">
            <PhotoImage
              :photo="triggerPhoto"
              context="thumb"
              loading="lazy"
              class="w-full block aspect-square object-cover"
            />
            <figcaption class="flex justify-between gap-2 px-3 py-2.5 text-toned text-xs">
              <span>{{ triggerPhoto.caption }}</span>
              <small class="text-muted">#{{ index + 1 }}</small>
            </figcaption>
          </figure>
        </template>
      </PhotoTrigger>
    </div>

    <div class="flex flex-wrap gap-1.5 items-center text-muted text-sm">
      <span>Open a frame to inspect {{ props.mode === 'gestures' ? 'gesture and zoom state.' : 'the live lightbox state.' }}</span>
      <code class="px-1.5 py-0.5 border border-default rounded-md bg-elevated text-highlighted">Esc</code>
      <code class="px-1.5 py-0.5 border border-default rounded-md bg-elevated text-highlighted">←</code>
      <code class="px-1.5 py-0.5 border border-default rounded-md bg-elevated text-highlighted">→</code>
      <code class="px-1.5 py-0.5 border border-default rounded-md bg-elevated text-highlighted">Double-click</code>
      <code class="px-1.5 py-0.5 border border-default rounded-md bg-elevated text-highlighted">Wheel</code>
    </div>

    <LightboxRoot class="np-lightbox" role="dialog" aria-modal="true">
      <LightboxOverlay class="np-lightbox__backdrop" @click.capture="markClosing" />

      <div class="np-lightbox__ui relative">
        <LightboxControls v-slot="{ activeIndex, count, prev, next, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
          <div class="np-lightbox__topbar gap-4">
            <div class="flex flex-wrap gap-2 items-center">
              <span class="np-lightbox__counter">{{ activeIndex + 1 }} / {{ count }}</span>
              <span class="status-chip inline-block px-2 py-1 rounded-full text-xs status-chip--active">{{ lifecycle }}</span>
              <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">{{ ctx.gesturePhase.value }}</span>
              <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">{{ isZoomedIn ? 'zoomed' : 'fit' }}</span>
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

        <div class="absolute left-4 bottom-5 z-5 grid grid-cols-2 gap-2.5 w-[min(340px,calc(100vw-2rem))] pointer-events-none hud-reflow">
          <div class="px-3 py-2.5 rounded-xl hud-card">
            <span class="block text-xs uppercase tracking-widest">Status</span>
            <strong>{{ lifecycle }}</strong>
          </div>
          <div class="px-3 py-2.5 rounded-xl hud-card">
            <span class="block text-xs uppercase tracking-widest">Gesture</span>
            <strong>{{ ctx.gesturePhase.value }}</strong>
          </div>
          <div class="px-3 py-2.5 rounded-xl hud-card">
            <span class="block text-xs uppercase tracking-widest">Zoom</span>
            <strong>{{ ctx.zoomState.value.current.toFixed(2) }}x</strong>
          </div>
          <div class="px-3 py-2.5 rounded-xl hud-card">
            <span class="block text-xs uppercase tracking-widest">Pan</span>
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
              <div class="grid gap-2.5">
                <h2 v-if="photo?.caption" class="m-0 text-highlighted">{{ photo.caption }}</h2>
                <p v-if="photo?.description" class="m-0 text-muted">{{ photo.description }}</p>
                <div v-if="props.mode === 'anatomy'" class="flex flex-wrap gap-1.5">
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxRoot</span>
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxOverlay</span>
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxViewport</span>
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxSlide</span>
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxControls</span>
                  <span class="status-chip inline-block px-2 py-1 rounded-full text-xs">LightboxCaption</span>
                </div>
                <p v-if="props.mode === 'provider'" class="text-sm">
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
