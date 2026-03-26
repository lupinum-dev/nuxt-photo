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
      :photos="ctx.photos.value"
      :embla-ref="ctx.emblaRef"
      :media-opacity="ctx.mediaOpacity.value"
      :is-zoomed-in="ctx.isZoomedIn.value"
      :gesture-phase="ctx.gesturePhase.value"
    />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxStageKey } from '../provide/keys'

const ctx = inject(LightboxStageKey)!
</script>
