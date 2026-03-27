<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.activePhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxCaption')
</script>
