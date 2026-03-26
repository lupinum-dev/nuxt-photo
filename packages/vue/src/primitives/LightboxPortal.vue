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
import { LightboxPortalKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxPortalKey, 'LightboxPortal', 'an active lightbox portal context')
</script>
