<template>
  <div :style="ctx.backdropStyle.value" v-bind="$attrs" @click="ctx.handleBackdropClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { LightboxOverlayKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxOverlayKey, 'LightboxOverlay', 'an active lightbox overlay context')
</script>
