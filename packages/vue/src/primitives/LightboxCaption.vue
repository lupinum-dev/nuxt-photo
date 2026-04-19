<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.activePhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../composables/useLightboxInject'
import type { LightboxCaptionSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxCaptionSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxCaption')
</script>
