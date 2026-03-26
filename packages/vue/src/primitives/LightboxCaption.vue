<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.activePhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxCaptionKey } from '../provide/keys'

const ctx = inject(LightboxCaptionKey)!
</script>
