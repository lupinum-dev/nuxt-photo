<template>
  <div :style="ctx.backdropStyle.value" v-bind="$attrs" @click="ctx.handleBackdropClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxOverlayKey } from '../provide/keys'

const ctx = inject(LightboxOverlayKey)!
</script>
