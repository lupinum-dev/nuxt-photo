<template>
  <Teleport to="body">
    <div v-if="ctx.isOpen.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { inject } from 'vue'
import { LightboxControllerKey } from '../provide/keys'

const ctx = inject(LightboxControllerKey)!
</script>
