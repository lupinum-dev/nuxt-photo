<template>
  <div :style="ctx.backdropStyle.value" v-bind="$attrs" @click="ctx.handleBackdropClick">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { LightboxContextKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxContextKey, 'LightboxOverlay', 'an active lightbox context')
</script>
