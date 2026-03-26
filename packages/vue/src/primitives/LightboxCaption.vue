<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.currentPhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxContextKey } from '../provide/keys'

const ctx = inject(LightboxContextKey)!
</script>
