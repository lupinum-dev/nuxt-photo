<template>
  <div
    :ref="
      (el) => {
        ctx.mediaAreaRef.value = el as HTMLElement | null
        ctx.setViewportRef(el as Element | null)
      }
    "
    v-bind="$attrs"
    data-np-motion="viewport"
    :data-zoomed="ctx.isZoomedIn.value || undefined"
    :data-gesture="
      ctx.gesturePhase.value !== 'idle' ? ctx.gesturePhase.value : undefined
    "
    @pointerdown.capture="ctx.onMediaPointerDown"
    @pointermove.capture="ctx.onMediaPointerMove"
    @pointerup.capture="ctx.onMediaPointerUp"
    @pointercancel.capture="ctx.onMediaPointerCancel"
    @lostpointercapture.capture="ctx.onMediaPointerCancel"
    @wheel="ctx.onWheel"
  >
    <slot
      v-if="ctx.stageMounted.value"
      :photos="ctx.photos.value"
      :viewport-ref="ctx.emblaRef"
      :image-load-failed="ctx.activeImageLoadFailed.value"
    />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../lightbox/inject'
import type { LightboxViewportSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxViewportSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxViewport')
</script>
