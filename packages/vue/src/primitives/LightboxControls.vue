<template>
  <div :style="ctx.chromeStyle.value" v-bind="$attrs">
    <slot
      :active-index="ctx.activeIndex"
      :current-photo="ctx.currentPhoto"
      :photos="ctx.photos"
      :is-zoomed-in="ctx.isZoomedIn"
      :zoom-allowed="ctx.zoomAllowed"
      :controls-disabled="ctx.controlsDisabled"
      :next="ctx.next"
      :prev="ctx.prev"
      :close="ctx.close"
      :toggle-zoom="ctx.toggleZoom"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxContextKey } from '../provide/keys'

const ctx = inject(LightboxContextKey)!
</script>
