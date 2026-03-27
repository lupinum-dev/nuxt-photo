<template>
  <div :style="ctx.chromeStyle.value" v-bind="$attrs">
    <div
      data-np-sr-only
      aria-live="polite"
      aria-atomic="true"
    >Photo {{ ctx.activeIndex.value + 1 }} of {{ ctx.count.value }}</div>
    <slot
      :active-index="ctx.activeIndex.value"
      :active-photo="ctx.activePhoto.value"
      :photos="ctx.photos.value"
      :count="ctx.count.value"
      :is-zoomed-in="ctx.isZoomedIn.value"
      :zoom-allowed="ctx.zoomAllowed.value"
      :controls-disabled="ctx.transitionInProgress.value"
      :next="ctx.next"
      :prev="ctx.prev"
      :close="ctx.close"
      :toggle-zoom="ctx.toggleZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { LightboxContextKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxContextKey, 'LightboxControls', 'an active lightbox context')
</script>
