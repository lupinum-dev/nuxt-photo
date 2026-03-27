<template>
  <div
    :ref="(el) => { ctx.mediaAreaRef.value = el as HTMLElement | null }"
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
import { LightboxContextKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxContextKey, 'LightboxViewport', 'an active lightbox context')
</script>
