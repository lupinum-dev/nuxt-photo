<template>
  <div
    :ref="ctx.setOverlayRef"
    data-np-motion="backdrop"
    v-bind="$attrs"
    @click.self="ctx.handleBackdropClick"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../lightbox/inject'

const ctx = useLightboxInject('LightboxOverlay')
</script>
