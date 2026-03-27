<template>
  <img
    v-if="ctx.ghostVisible.value"
    :src="ctx.ghostSrc.value"
    alt=""
    aria-hidden="true"
    :style="ctx.ghostStyle.value"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { LightboxContextKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxContextKey, 'LightboxPortal', 'an active lightbox context')
</script>
