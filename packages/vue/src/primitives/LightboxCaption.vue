<template>
  <div :ref="ctx.setCaptionRef" data-np-motion="caption" v-bind="$attrs">
    <slot
      :photo="ctx.activePhoto.value"
      :active-index="ctx.activeIndex.value"
    />
  </div>
</template>

<script setup lang="ts">
import { useLightboxInject } from '../lightbox/inject'
import type { LightboxCaptionSlotProps } from '../types/slots'

defineSlots<{ default?: (props: LightboxCaptionSlotProps) => unknown }>()

const ctx = useLightboxInject('LightboxCaption')
</script>
