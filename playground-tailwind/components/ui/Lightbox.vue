<template>
  <LightboxRoot class="fixed inset-0 z-50 flex flex-col" role="dialog" aria-modal="true">
    <LightboxOverlay class="absolute inset-0 bg-black/90" />

    <div class="relative z-10 flex flex-1 flex-col">
      <LightboxControls v-slot="{ activeIndex, count, prev, next, close, toggleZoom, isZoomedIn, zoomAllowed, controlsDisabled }">
        <div class="flex items-center justify-between px-5 py-3">
          <span class="text-sm tabular-nums text-white/50">
            {{ activeIndex + 1 }} / {{ count }}
          </span>

          <div class="flex items-center gap-1">
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
              aria-label="Previous"
              :disabled="controlsDisabled"
              @click="prev"
            >
              &#8592;
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
              aria-label="Next"
              :disabled="controlsDisabled"
              @click="next"
            >
              &#8594;
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
              :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
              :disabled="controlsDisabled || !zoomAllowed"
              @click="toggleZoom()"
            >
              {{ isZoomedIn ? 'Fit' : 'Zoom' }}
            </button>
            <button
              class="rounded-lg px-3 py-1.5 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-30"
              aria-label="Close"
              :disabled="controlsDisabled"
              @click="close"
            >
              &#10005;
            </button>
          </div>
        </div>
      </LightboxControls>

      <div class="flex flex-1 flex-col items-center justify-center overflow-hidden">
        <LightboxViewport v-slot="{ photos, emblaRef, mediaOpacity }" class="w-full flex-1">
          <div class="h-full" :ref="emblaRef" :style="{ opacity: mediaOpacity }">
            <div class="flex h-full">
              <LightboxSlide
                v-for="(photo, i) in photos"
                :key="photo.id"
                :photo="photo"
                :index="i"
                class="min-w-0 flex-[0_0_100%]"
              />
            </div>
          </div>
        </LightboxViewport>

        <LightboxCaption class="px-5 py-4 text-center" v-slot="{ photo }">
          <h2 v-if="photo?.caption" class="text-base font-medium text-white/90">
            {{ photo.caption }}
          </h2>
          <p v-if="photo?.description" class="mt-1 text-sm text-white/50">
            {{ photo.description }}
          </p>
        </LightboxCaption>
      </div>
    </div>

    <LightboxPortal class="pointer-events-none fixed inset-0 z-50" />
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
</script>
