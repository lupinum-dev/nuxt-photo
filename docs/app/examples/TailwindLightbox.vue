<template>
  <!--
    The framed lightbox in Tailwind utilities. The mat comes from the three
    --np-frame-inset-* variables; the runtime then publishes where the photo is
    drawn as --np-frame-x/y/width/height, which place the label and arrows.
  -->
  <LightboxRoot
    class="group fixed inset-0 z-50 text-stone-100 [--np-frame-inset-bottom:120px] [--np-frame-inset-inline:clamp(80px,7vw,120px)] [--np-frame-inset-top:72px] max-[699px]:[--np-frame-inset-bottom:108px] max-[699px]:[--np-frame-inset-inline:12px] max-[699px]:[--np-frame-inset-top:64px]"
    role="dialog"
    aria-modal="true"
    aria-label="Photo viewer"
  >
    <LightboxOverlay class="absolute inset-0 overflow-hidden bg-stone-950">
      <LightboxAmbient class="pointer-events-none absolute -inset-[8%] opacity-45" />
      <div class="absolute inset-0 bg-stone-950/40" />
    </LightboxOverlay>

    <LightboxControls
      class="pointer-events-none absolute inset-0 z-20"
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
      <div
        class="absolute inset-x-4 top-4 flex items-center justify-between max-[699px]:inset-x-3 max-[699px]:top-3"
      >
        <span
          class="pointer-events-auto flex h-[42px] items-center rounded-full border border-white/10 bg-stone-900/60 px-3.5 text-[13px] tabular-nums text-stone-200/80 backdrop-blur-md"
          aria-hidden="true"
        >
          {{ activeIndex + 1 }} / {{ count }}
        </span>

        <div
          class="pointer-events-auto flex gap-0.5 rounded-full border border-white/10 bg-stone-900/60 p-[3px] backdrop-blur-md"
        >
          <button
            type="button"
            :class="toolClass"
            :aria-label="isZoomedIn ? 'Fit' : 'Zoom'"
            :title="isZoomedIn ? 'Fit' : 'Zoom'"
            :disabled="controlsDisabled || !zoomAllowed"
            @click="toggleZoom()"
          >
            <svg viewBox="0 0 24 24" :class="iconClass" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path v-if="isZoomedIn" d="M20 20l-4.2-4.2M8.5 11h5" />
              <path v-else d="M20 20l-4.2-4.2M11 8.5v5M8.5 11h5" />
            </svg>
          </button>
          <button type="button" :class="toolClass" aria-label="Close" title="Close" @click="close">
            <svg viewBox="0 0 24 24" :class="iconClass" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      <button
        type="button"
        :class="[arrowClass, 'start-5']"
        aria-label="Previous"
        :disabled="controlsDisabled"
        @click="prev"
      >
        <svg viewBox="0 0 24 24" :class="iconClass" aria-hidden="true">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
      <button
        type="button"
        :class="[arrowClass, 'end-5']"
        aria-label="Next"
        :disabled="controlsDisabled"
        @click="next"
      >
        <svg viewBox="0 0 24 24" :class="iconClass" aria-hidden="true">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>
    </LightboxControls>

    <LightboxViewport v-slot="{ photos, viewportRef }" class="absolute inset-0 z-10 touch-none">
      <div class="absolute inset-0 overflow-hidden" :ref="viewportRef">
        <div class="flex h-full touch-none">
          <LightboxSlide
            v-for="(photo, i) in photos"
            :key="photo.id"
            :photo="photo"
            :index="i"
            class="grid min-w-0 flex-[0_0_100%] place-items-center [&_img]:rounded-md [&_img]:shadow-[0_30px_80px_rgb(0_0_0/0.45),0_2px_10px_rgb(0_0_0/0.35)] in-data-zoomed:[&_img]:rounded-none in-data-zoomed:[&_img]:shadow-none"
          />
        </div>
      </div>
    </LightboxViewport>

    <LightboxCaption
      class="absolute z-20 top-[calc(var(--np-frame-y)+var(--np-frame-height)+14px)] left-[clamp(12px,var(--np-frame-x),calc(100vw-12px-var(--np-caption-w)))] w-(--np-caption-w) [--np-caption-w:min(max(var(--np-frame-width),320px),calc(100vw-24px))] transition-[top,left,width] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-has-data-zoomed:invisible"
      v-slot="{ photo }"
    >
      <Transition
        mode="out-in"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        leave-active-class="transition-opacity duration-75"
        leave-to-class="opacity-0"
      >
        <div :key="photo?.id ?? 'none'">
          <h2
            v-if="photo?.caption"
            class="text-[17px] leading-snug font-medium tracking-tight text-balance"
          >
            {{ photo.caption }}
          </h2>
          <p
            v-if="photo?.description"
            class="mt-1 line-clamp-2 text-sm leading-normal text-stone-300/70"
          >
            {{ photo.description }}
          </p>
        </div>
      </Transition>
    </LightboxCaption>
  </LightboxRoot>
</template>

<script setup lang="ts">
import {
  LightboxAmbient,
  LightboxCaption,
  LightboxControls,
  LightboxOverlay,
  LightboxRoot,
  LightboxSlide,
  LightboxViewport,
} from '@lupinum/nuxt-photo/app'

const iconClass =
  'size-5 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]'
const toolClass =
  'grid size-9 place-items-center rounded-full text-stone-100 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 active:scale-95 disabled:opacity-35'
const arrowClass =
  'pointer-events-auto fixed top-0 grid size-11 translate-y-[calc(var(--np-frame-y)+var(--np-frame-height)/2-22px)] place-items-center rounded-full border border-white/10 bg-stone-900/60 text-stone-100 backdrop-blur-md transition-[translate,background-color,scale] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-stone-800/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-100 active:scale-95 disabled:opacity-35 max-[699px]:opacity-0 max-[699px]:[clip-path:inset(50%)] max-[699px]:focus-visible:opacity-100 max-[699px]:focus-visible:[clip-path:none]'
</script>
