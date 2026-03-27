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
import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxPortal')
</script>
