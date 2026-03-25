<template>
  <Teleport to="body">
    <div v-if="ctx.lightboxMounted.value" v-bind="$attrs">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { provide, inject } from 'vue'
import { LightboxContextKey, type LightboxContext } from '../provide/keys'

const props = defineProps<{
  context?: LightboxContext
}>()

const ctx = props.context ?? inject(LightboxContextKey)!

if (props.context) {
  provide(LightboxContextKey, props.context)
}

defineExpose({ context: ctx })
</script>
