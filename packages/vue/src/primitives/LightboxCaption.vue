<template>
  <div v-bind="$attrs">
    <slot :photo="ctx.activePhoto.value" :active-index="ctx.activeIndex.value" />
  </div>
</template>

<script setup lang="ts">
import { LightboxCaptionKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxCaptionKey, 'LightboxCaption', 'an active lightbox caption context')
</script>
