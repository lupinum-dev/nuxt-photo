<template>
  <div data-np-transition-layer aria-hidden="true">
    <div data-np-transition-frame>
      <div data-np-transition-shadow />
      <img
        ref="image"
        data-np-transition-image
        alt=""
        draggable="false"
        decoding="async"
        :style="{ backgroundColor: loaded && !failed ? undefined : colour }"
        @load="handleLoad"
        @error="handleError"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useImagePaint } from '../primitives/imagePaint'
import { useLightboxInject } from '../lightbox/inject'

const ctx = useLightboxInject('LightboxTransitionLayer')
const image = ref<HTMLImageElement | null>(null)
const { loaded, failed, handleLoad, handleError, resetRequestState } = useImagePaint(image)
const colour = computed(() => {
  const photo = ctx.activePhoto.value
  return (
    photo?._placeholderColor ??
    (photo && ctx.photoConfig.value.dimensions?.(photo.src)?._placeholderColor) ??
    'var(--np-placeholder-bg, #e5e7eb)'
  )
})
watch([ctx.activePhoto, ctx.transitionInProgress], resetRequestState, { flush: 'post' })
</script>
