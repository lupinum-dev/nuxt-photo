<template>
  <Teleport to="body">
    <div v-if="ctx.isOpen.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { LightboxControllerKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxControllerKey, 'LightboxRoot', 'an active lightbox controller context')
</script>
