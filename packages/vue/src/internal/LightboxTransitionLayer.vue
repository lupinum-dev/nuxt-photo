<template>
  <div data-np-transition-layer aria-hidden="true">
    <div :ref="ctx.setTransitionFrameRef" data-np-transition-frame>
      <div :ref="ctx.setTransitionShadowRef" data-np-transition-shadow />
      <img
        :ref="setImage"
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
import { computed, ref, watch, type ComponentPublicInstance } from 'vue'
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
function setImage(element: Element | ComponentPublicInstance | null) {
  ctx.setTransitionImageRef(element)
  image.value = element instanceof HTMLImageElement ? element : null
}
watch([ctx.activePhoto, ctx.transitionInProgress], resetRequestState, { flush: 'post' })
</script>
