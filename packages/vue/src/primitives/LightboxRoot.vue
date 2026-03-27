<template>
  <Teleport to="body">
    <div v-if="ctx.isOpen.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

import { useLightboxInject } from '../composables/useLightboxInject'

const ctx = useLightboxInject('LightboxRoot')
</script>
