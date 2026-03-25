<template>
  <div
    ref="ctx.mediaAreaRef"
    v-bind="$attrs"
    @pointerdown.capture="ctx.onMediaPointerDown"
    @pointermove.capture="ctx.onMediaPointerMove"
    @pointerup.capture="ctx.onMediaPointerUp"
    @pointercancel.capture="ctx.onMediaPointerCancel"
    @wheel="ctx.onWheel"
  >
    <slot
      :embla-ref="ctx.emblaRef"
      :media-opacity="ctx.mediaOpacity"
      :is-zoomed-in="ctx.isZoomedIn"
      :gesture-phase="ctx.gesturePhase"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxContextKey } from '../provide/keys'

const ctx = inject(LightboxContextKey)!
</script>
