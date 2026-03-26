<template>
  <div :style="ctx.chromeStyle.value" v-bind="$attrs">
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
import { LightboxChromeKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxChromeKey, 'LightboxControls', 'an active lightbox chrome context')
</script>
