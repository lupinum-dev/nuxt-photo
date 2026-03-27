<template>
  <Teleport to="body">
    <div v-if="ctx.isOpen.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { LightboxContextKey } from '../provide/keys'
import { requireInjection } from '../internal/requireInjection'

const ctx = requireInjection(LightboxContextKey, 'LightboxRoot', 'an active lightbox context')
</script>
