<template>
  <div data-np-transition-layer aria-hidden="true">
    <div :ref="ctx.setTransitionFrameRef" data-np-transition-frame>
      <div :ref="ctx.setTransitionShadowRef" data-np-transition-shadow />
      <img :ref="ctx.setTransitionImageRef" data-np-transition-image alt="" draggable="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../lightbox/inject'

const ctx = useLightboxInject('LightboxTransitionLayer')
</script>
