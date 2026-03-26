<template>
  <div :style="ctx.chromeStyle.value" v-bind="$attrs">
    <slot
      :active-index="ctx.activeIndex.value"
      :current-photo="ctx.activePhoto.value"
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
import { inject } from 'vue'
import { LightboxChromeKey } from '../provide/keys'

const ctx = inject(LightboxChromeKey)!
</script>
