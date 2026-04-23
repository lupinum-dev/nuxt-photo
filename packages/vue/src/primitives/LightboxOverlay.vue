<template>
  <div
    :style="ctx.backdropStyle.value"
    v-bind="$attrs"
    @click.self="ctx.handleBackdropClick"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxOverlay')
</script>
