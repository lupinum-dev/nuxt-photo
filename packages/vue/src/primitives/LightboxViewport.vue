<template>
  <div
    :ref="ctx.mediaAreaRef"
    v-bind="$attrs"
    :data-zoomed="ctx.isZoomedIn.value || undefined"
    :data-gesture="ctx.gesturePhase.value !== 'idle' ? ctx.gesturePhase.value : undefined"
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
    />
  </div>
</template>

<script setup lang="ts">
import { LightboxStageKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxStageKey, 'LightboxViewport', 'an active lightbox stage context')
</script>
