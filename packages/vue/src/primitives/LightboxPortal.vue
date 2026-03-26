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
import { inject } from 'vue'
import { LightboxPortalKey } from '../provide/keys'

const ctx = inject(LightboxPortalKey)!
</script>
